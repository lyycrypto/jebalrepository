// Firebase 설정 파일
// 아래 값들을 본인의 Firebase 프로젝트 설정으로 교체하세요!

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCKBioVHzRjKB7DTpoogIcHa8HaCw9odao",
  authDomain: "timetable-25777.firebaseapp.com",
  databaseURL: "https://timetable-25777-default-rtdb.firebaseio.com",
  projectId: "timetable-25777",
  storageBucket: "timetable-25777.firebasestorage.app",
  messagingSenderId: "888767539366",
  appId: "1:888767539366:web:9ed071d80581e0dd3eac67"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
