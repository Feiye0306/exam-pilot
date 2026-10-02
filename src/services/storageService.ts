import { ExamPaper, Student, TrackItem, StudentSubjectTrack } from '../types';
import { INITIAL_PAPERS, INITIAL_STUDENTS } from '../mock/initialData';
import { db, storage, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const LOCAL_STORAGE_PAPERS_KEY = 'exam_pilot_papers_v1';
const LOCAL_STORAGE_STUDENTS_KEY = 'exam_pilot_students_v1';

// 考卷庫快取與存取
export const getLocalPapers = (): ExamPaper[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_PAPERS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_PAPERS_KEY, JSON.stringify(INITIAL_PAPERS));
      return INITIAL_PAPERS;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_PAPERS;
  }
};

export const saveLocalPapers = (papers: ExamPaper[]) => {
  localStorage.setItem(LOCAL_STORAGE_PAPERS_KEY, JSON.stringify(papers));
};

// 學生與軌道快取與存取
export const getLocalStudents = (): Student[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_STUDENTS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_STUDENTS;
  }
};

export const saveLocalStudents = (students: Student[]) => {
  localStorage.setItem(LOCAL_STORAGE_STUDENTS_KEY, JSON.stringify(students));
};

// 雲端即時監聽與同步服務
export const subscribeToPapers = (onUpdate: (papers: ExamPaper[]) => void) => {
  if (isFirebaseConfigured && db) {
    const papersCol = collection(db, 'papers');
    return onSnapshot(papersCol, (snapshot) => {
      if (!snapshot.empty) {
        const cloudPapers: ExamPaper[] = [];
        snapshot.forEach((docSnap) => {
          cloudPapers.push(docSnap.data() as ExamPaper);
        });
        saveLocalPapers(cloudPapers);
        onUpdate(cloudPapers);
      } else {
        // 雲端若為空，初始化推播種子資料
        const local = getLocalPapers();
        local.forEach((p) => {
          setDoc(doc(db, 'papers', p.id), p).catch(console.error);
        });
        onUpdate(local);
      }
    }, (error) => {
      console.warn('Firestore 監聽考卷異常，切回本機儲存:', error);
      onUpdate(getLocalPapers());
    });
  } else {
    // 降級為本地事件監聽
    onUpdate(getLocalPapers());
    return () => {};
  }
};

export const subscribeToStudents = (onUpdate: (students: Student[]) => void) => {
  if (isFirebaseConfigured && db) {
    const studentsCol = collection(db, 'students');
    return onSnapshot(studentsCol, (snapshot) => {
      if (!snapshot.empty) {
        const cloudStudents: Student[] = [];
        snapshot.forEach((docSnap) => {
          cloudStudents.push(docSnap.data() as Student);
        });
        saveLocalStudents(cloudStudents);
        onUpdate(cloudStudents);
      } else {
        // 雲端為空時，寫入種子資料
        const local = getLocalStudents();
        local.forEach((s) => {
          setDoc(doc(db, 'students', s.id), s).catch(console.error);
        });
        onUpdate(local);
      }
    }, (error) => {
      console.warn('Firestore 監聽學生異常，切回本機儲存:', error);
      onUpdate(getLocalStudents());
    });
  } else {
    onUpdate(getLocalStudents());
    return () => {};
  }
};

// 新增或更新考卷
export const savePaper = async (paper: ExamPaper) => {
  const current = getLocalPapers();
  const index = current.findIndex(p => p.id === paper.id);
  let updated: ExamPaper[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = paper;
  } else {
    updated = [paper, ...current];
  }
  saveLocalPapers(updated);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'papers', paper.id), paper);
    } catch (e) {
      console.error('寫入 Firebase 考卷失敗:', e);
    }
  }
  return updated;
};

// 新增或更新學生
export const saveStudent = async (student: Student) => {
  const current = getLocalStudents();
  const index = current.findIndex(s => s.id === student.id);
  let updated: Student[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...student, updatedAt: Date.now() };
  } else {
    updated = [{ ...student, updatedAt: Date.now() }, ...current];
  }
  saveLocalStudents(updated);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (e) {
      console.error('寫入 Firebase 學生失敗:', e);
    }
  }
  return updated;
};

// 輔導老師登記成績並解鎖下一關
export const completeTrackItem = async ({
  studentId,
  subject,
  itemId,
  score,
  tutorName,
  tutorNotes,
  photoUrls = []
}: {
  studentId: string;
  subject: string;
  itemId: string;
  score: number;
  tutorName: string;
  tutorNotes: string;
  photoUrls?: string[];
}): Promise<Student | null> => {
  const students = getLocalStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return null;

  const track = student.tracks[subject];
  if (!track || !track.items) return null;

  const itemIndex = track.items.findIndex(it => it.itemId === itemId);
  if (itemIndex === -1) return null;

  // 1. 更新當前完成項
  const now = Date.now();
  const updatedItems = [...track.items];
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    status: 'completed',
    score,
    tutorName: tutorName || '輔導老師',
    tutorNotes: tutorNotes || null,
    completedAt: now,
    submissionPhotoUrls: photoUrls.length > 0 ? photoUrls : updatedItems[itemIndex].submissionPhotoUrls || []
  };

  // 2. 自動將下一張 pending 的考卷標記為可發放狀態（若有的話）
  const nextPendingIndex = updatedItems.findIndex((it, idx) => idx > itemIndex && it.status === 'pending');
  if (nextPendingIndex !== -1) {
    // 保持 pending 或可視為可派發
  }

  const updatedStudent: Student = {
    ...student,
    updatedAt: now,
    tracks: {
      ...student.tracks,
      [subject]: {
        ...track,
        updatedAt: now,
        items: updatedItems
      }
    }
  };

  await saveStudent(updatedStudent);
  return updatedStudent;
};

// 批次派卷：將同一張考卷一次發放加入多位學生的科目軌道
export const batchAssignPaperToStudents = async (params: {
  paper: ExamPaper;
  studentIds: string[];
  subject: string;
  tutorNotes?: string;
}): Promise<Student[]> => {
  const { paper, studentIds, subject, tutorNotes } = params;
  const allStudents = getLocalStudents();
  const now = Date.now();

  const updatedStudents = allStudents.map((student) => {
    if (!studentIds.includes(student.id)) return student;

    const currentTrack = student.tracks[subject] || {
      subject,
      updatedAt: now,
      items: []
    };

    const newItem: TrackItem = {
      itemId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      paperId: paper.id,
      paperTitle: paper.title,
      subject,
      difficulty: paper.difficulty,
      targetMinutes: paper.targetMinutes,
      status: 'pending',
      score: null,
      maxScore: 100,
      assignedAt: now,
      completedAt: null,
      tutorName: null,
      tutorNotes: tutorNotes || null,
      submissionPhotoUrls: [],
    };

    return {
      ...student,
      updatedAt: now,
      tracks: {
        ...student.tracks,
        [subject]: {
          ...currentTrack,
          updatedAt: now,
          items: [...currentTrack.items, newItem]
        }
      }
    };
  });

  saveLocalStudents(updatedStudents);

  if (isFirebaseConfigured && db) {
    for (const stu of updatedStudents) {
      if (studentIds.includes(stu.id)) {
        setDoc(doc(db, 'students', stu.id), stu).catch(console.error);
      }
    }
  }

  return updatedStudents;
};

// 批次快速儲存多張考卷至題庫 (直接從本機資料夾讀取後一鍵存入)
export const batchSavePapers = async (newPapers: ExamPaper[]): Promise<ExamPaper[]> => {
  const current = getLocalPapers();
  const combined = [...newPapers, ...current.filter(p => !newPapers.some(np => np.id === p.id))];
  saveLocalPapers(combined);

  if (isFirebaseConfigured && db) {
    for (const p of newPapers) {
      setDoc(doc(db, 'papers', p.id), p).catch(console.error);
    }
  }

  return combined;
};

// 照片壓縮處理，回傳可直接呈現或儲存的 DataURL (避免手機上傳超大原始圖耗盡流量)
export const compressImage = (file: File, maxWidth = 1200, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

