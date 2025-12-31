'use client';

import { useState, useEffect } from 'react';
import { database } from '../lib/firebase2';
import { ref, onValue, set, remove } from 'firebase/database';

const SUBJECTS = [
  { name: '국어', color: '#EF4444', bg: '#FEE2E2' },
  { name: '언매', color: '#F97316', bg: '#FFEDD5' },
  { name: '미적분', color: '#EAB308', bg: '#FEF9C3' },
  { name: '수학공통', color: '#22C55E', bg: '#DCFCE7' },
  { name: '영어', color: '#3B82F6', bg: '#DBEAFE' },
  { name: '사문', color: '#6366F1', bg: '#E0E7FF' },
  { name: '세계사', color: '#A855F7', bg: '#F3E8FF' },
];

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const getSubjectStyle = (subjectName) => {
  const subject = SUBJECTS.find(s => s.name === subjectName);
  return subject ? { color: subject.color, bg: subject.bg } : { color: '#6B7280', bg: '#F3F4F6' };
};

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [scheduleImage, setScheduleImage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    subject: '국어',
    dueDate: '',
    name: '',
    description: '',
    isRepeating: false,
    repeatDay: 0,
    repeatCount: 1,
  });

  // Firebase 실시간 동기화
  useEffect(() => {
    const assignmentsRef = ref(database, 'assignments');
    const imageRef = ref(database, 'scheduleImage');

    const unsubAssignments = onValue(assignmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const assignmentList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value
        }));
        setAssignments(assignmentList);
      } else {
        setAssignments([]);
      }
      setLoading(false);
    });

    const unsubImage = onValue(imageRef, (snapshot) => {
      setScheduleImage(snapshot.val());
    });

    return () => {
      unsubAssignments();
      unsubImage();
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setScheduleImage(imageData);
        set(ref(database, 'scheduleImage'), imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setScheduleImage(null);
    remove(ref(database, 'scheduleImage'));
  };

  const addAssignment = () => {
    if (!formData.name || !formData.dueDate) return;

    if (formData.isRepeating) {
      const baseDate = new Date(formData.dueDate);
      
      for (let i = 0; i < formData.repeatCount; i++) {
        const assignmentDate = new Date(baseDate);
        assignmentDate.setDate(baseDate.getDate() + (i * 7));
        
        const newId = `${Date.now()}_${i}`;
        set(ref(database, `assignments/${newId}`), {
          subject: formData.subject,
          dueDate: assignmentDate.toISOString().split('T')[0],
          name: `${formData.name}(${i + 1})`,
          description: formData.description,
          completed: false,
        });
      }
    } else {
      const newId = Date.now().toString();
      set(ref(database, `assignments/${newId}`), {
        subject: formData.subject,
        dueDate: formData.dueDate,
        name: formData.name,
        description: formData.description,
        completed: false,
      });
    }

    setFormData({
      subject: '국어',
      dueDate: '',
      name: '',
      description: '',
      isRepeating: false,
      repeatDay: 0,
      repeatCount: 1,
    });
    setShowAddModal(false);
  };

  const toggleComplete = (id) => {
    const assignment = assignments.find(a => a.id === id);
    if (assignment) {
      set(ref(database, `assignments/${id}/completed`), !assignment.completed);
    }
  };

  const deleteAssignment = (id) => {
    remove(ref(database, `assignments/${id}`));
  };

  const sortedAssignments = [...assignments].sort((a, b) => 
    new Date(a.dueDate) - new Date(b.dueDate)
  );

  const getWeekNumber = (date) => {
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const getWeeksData = () => {
    const weeks = {};
    assignments.forEach(a => {
      const weekNum = getWeekNumber(a.dueDate);
      const dayOfWeek = (new Date(a.dueDate).getDay() + 6) % 7;
      const key = `${new Date(a.dueDate).getFullYear()}-${weekNum}`;
      
      if (!weeks[key]) {
        weeks[key] = { weekNum, days: Array(7).fill([]).map(() => []) };
      }
      weeks[key].days[dayOfWeek].push(a);
    });
    return Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getAssignmentsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return assignments.filter(a => a.dueDate === dateStr);
  };

  const AssignmentCard = ({ assignment, showDate = true }) => {
    const style = getSubjectStyle(assignment.subject);
    return (
      <div 
        className={`p-3 rounded-lg mb-2 border-l-4 ${assignment.completed ? 'opacity-50' : ''}`}
        style={{ backgroundColor: style.bg, borderLeftColor: style.color }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap"
                style={{ backgroundColor: style.color, color: 'white' }}
              >
                {assignment.subject}
              </span>
              {showDate && (
                <span className="text-xs text-gray-500">{assignment.dueDate}</span>
              )}
            </div>
            <p className={`font-medium mt-1 break-words ${assignment.completed ? 'line-through' : ''}`}>
              {assignment.name}
            </p>
            {assignment.description && (
              <p className="text-sm text-gray-600 mt-1 break-words">{assignment.description}</p>
            )}
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <button
              onClick={() => toggleComplete(assignment.id)}
              className={`w-7 h-7 rounded border-2 flex items-center justify-center ${
                assignment.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
              }`}
            >
              {assignment.completed && '✓'}
            </button>
            <button
              onClick={() => deleteAssignment(assignment.id)}
              className="w-7 h-7 rounded bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tabs = ['📋 시간표', '📅 주별', '📚 과목별', '🗓️ 달력'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-800">📝 과제 관리</h1>
        </div>
        <div className="max-w-6xl mx-auto px-2">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-3 py-2 rounded-t-lg whitespace-nowrap transition-all text-sm ${
                  activeTab === i 
                    ? 'bg-indigo-500 text-white font-medium' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Tab 1: 시간표 & 과제 입력 */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                🕐 시간표
              </h2>
              {scheduleImage ? (
                <div className="relative">
                  <img 
                    src={scheduleImage} 
                    alt="시간표" 
                    className="w-full max-h-96 object-contain rounded-lg border"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="text-gray-500">
                    <span className="text-4xl">📷</span>
                    <p className="mt-2">시간표 사진을 업로드하세요</p>
                    <p className="text-sm">탭하여 파일 선택</p>
                  </div>
                </label>
              )}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-indigo-500 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg active:scale-98"
            >
              + 새 과제 추가
            </button>

            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h2 className="text-lg font-bold mb-4">📋 과제 목록 (마감일순)</h2>
              {sortedAssignments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">아직 등록된 과제가 없어요</p>
              ) : (
                <div className="space-y-2">
                  {sortedAssignments.map(a => (
                    <AssignmentCard key={a.id} assignment={a} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 주별 보기 */}
        {activeTab === 1 && (
          <div className="space-y-4">
            {getWeeksData().length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500">
                등록된 과제가 없어요
              </div>
            ) : (
              getWeeksData().map(([key, week]) => (
                <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-indigo-500 text-white px-4 py-2 font-bold">
                    {key.split('-')[0]}년 {week.weekNum}주차
                  </div>
                  <div className="grid grid-cols-7 divide-x overflow-x-auto">
                    {DAYS.map((day, i) => (
                      <div key={i} className="min-h-24 min-w-12">
                        <div className={`text-center py-1 text-xs font-medium ${
                          i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-gray-700'
                        } bg-gray-50 border-b`}>
                          {day}
                        </div>
                        <div className="p-1 space-y-1">
                          {week.days[i].map(a => {
                            const style = getSubjectStyle(a.subject);
                            return (
                              <div
                                key={a.id}
                                className={`text-xs p-1 rounded ${a.completed ? 'opacity-50' : ''}`}
                                style={{ backgroundColor: style.bg, borderLeft: `2px solid ${style.color}` }}
                              >
                                <span className="font-bold block" style={{ color: style.color, fontSize: '10px' }}>
                                  {a.subject}
                                </span>
                                <p className={`truncate text-xs ${a.completed ? 'line-through' : ''}`}>
                                  {a.name}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: 과목별 보기 */}
        {activeTab === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            {SUBJECTS.map(subject => {
              const subjectAssignments = sortedAssignments.filter(a => a.subject === subject.name);
              return (
                <div 
                  key={subject.name} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div 
                    className="px-4 py-3 font-bold text-white"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.name} ({subjectAssignments.length})
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto">
                    {subjectAssignments.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">과제 없음</p>
                    ) : (
                      subjectAssignments.map(a => (
                        <AssignmentCard key={a.id} assignment={a} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: 월 달력 */}
        {activeTab === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg text-xl"
              >
                ◀
              </button>
              <h2 className="text-lg font-bold">
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg text-xl"
              >
                ▶
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day, i) => (
                <div 
                  key={day} 
                  className={`text-center py-2 text-sm font-medium ${
                    i === 5 ? 'text-blue-500' : i === 6 ? 'text-red-500' : 'text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map((date, i) => {
                const dayAssignments = date ? getAssignmentsForDate(date) : [];
                const isToday = date && date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate && date && selectedDate.toDateString() === date.toDateString();
                
                return (
                  <div
                    key={i}
                    onClick={() => date && setSelectedDate(date)}
                    className={`min-h-16 md:min-h-24 p-1 border rounded-lg cursor-pointer transition-all ${
                      !date ? 'bg-gray-50' : 
                      isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' :
                      isToday ? 'bg-yellow-50 border-yellow-300' : 
                      'hover:bg-gray-50'
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-xs md:text-sm font-medium mb-1 ${isToday ? 'text-yellow-600' : ''}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {dayAssignments.slice(0, 2).map(a => {
                            const style = getSubjectStyle(a.subject);
                            return (
                              <div
                                key={a.id}
                                className="text-xs px-1 py-0.5 rounded truncate hidden md:block"
                                style={{ backgroundColor: style.color, color: 'white' }}
                              >
                                {a.subject}
                              </div>
                            );
                          })}
                          {dayAssignments.length > 0 && (
                            <div className="md:hidden flex flex-wrap gap-0.5">
                              {dayAssignments.slice(0, 3).map(a => {
                                const style = getSubjectStyle(a.subject);
                                return (
                                  <div
                                    key={a.id}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: style.color }}
                                  />
                                );
                              })}
                            </div>
                          )}
                          {dayAssignments.length > 2 && (
                            <div className="text-xs text-gray-500 hidden md:block">+{dayAssignments.length - 2}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
                <h3 className="font-bold text-indigo-700 mb-3">
                  {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 과제
                </h3>
                {getAssignmentsForDate(selectedDate).length === 0 ? (
                  <p className="text-gray-500">이 날에는 과제가 없어요</p>
                ) : (
                  getAssignmentsForDate(selectedDate).map(a => (
                    <AssignmentCard key={a.id} assignment={a} showDate={false} />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 과제 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">새 과제 추가</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">과목</label>
                <div className="grid grid-cols-4 gap-2">
                  {SUBJECTS.map(s => (
                    <button
                      key={s.name}
                      onClick={() => setFormData({ ...formData, subject: s.name })}
                      className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.subject === s.name 
                          ? 'ring-2 ring-offset-2' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ 
                        backgroundColor: s.bg, 
                        color: s.color,
                        ringColor: s.color 
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-3 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">과제 이름</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 3단원 문제풀이"
                  className="w-full border rounded-lg px-3 py-3 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">추가 설명 (선택)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="메모할 내용이 있다면..."
                  className="w-full border rounded-lg px-3 py-3 h-20 text-base"
                />
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRepeating}
                    onChange={(e) => setFormData({ ...formData, isRepeating: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="font-medium">🔁 반복 과제 (매주 반복)</span>
                </label>

                {formData.isRepeating && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">반복 횟수 (주)</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.repeatCount}
                        onChange={(e) => setFormData({ ...formData, repeatCount: parseInt(e.target.value) || 1 })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      → {formData.name || '과제'}(1), {formData.name || '과제'}(2)... 형식으로 {formData.repeatCount}개 생성됨
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-lg border hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={addAssignment}
                disabled={!formData.name || !formData.dueDate}
                className="flex-1 py-3 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
