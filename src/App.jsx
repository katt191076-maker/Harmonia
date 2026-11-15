import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  BarChart3, 
  Settings, 
  ListTodo, 
  Activity, 
  Menu, 
  X, 
  Award,
  BellRing,
  Edit3,
  Save,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Repeat
} from 'lucide-react';

// --- CUSTOM YIN-YANG LOGO (PASTEL PINK) ---
const YinYangLogo = ({ className = "w-7 h-7" }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={`${className} shrink-0`} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="#F9B8C9" strokeWidth="1.75" fill="#1E293B" />
    <path 
      d="M12 2a10 10 0 0 1 0 20 5 5 0 0 1 0-10 5 5 0 0 0 0-10z" 
      fill="#F9B8C9" 
    />
    <circle cx="12" cy="7" r="1.6" fill="#F9B8C9" />
    <circle cx="12" cy="17" r="1.6" fill="#1E293B" />
  </svg>
);

// --- UTILS & DATE HELPERS ---

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatPolishDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pl-PL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Sprawdza czy zadanie stałe wypada w konkretnym dniu (targetDateStr)
const isRecurringOccurrenceOnDate = (task, targetDateStr) => {
  if (task.type !== 'recurring') return false;
  if (task.startDate && targetDateStr < task.startDate) return false;

  const [y, m, d] = targetDateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = String(dateObj.getDay()); // '0' (Nd) - '6' (Sob)
  const dayOfMonth = String(dateObj.getDate()); // '1' - '31'

  const freqType = task.freqType || 'weekly';

  if (freqType === 'daily') {
    return true;
  }
  if (freqType === 'weekly') {
    if (task.specDay !== '' && task.specDay !== undefined) {
      return dayOfWeek === String(task.specDay);
    }
    if (task.startDate) {
      const [sy, sm, sd] = task.startDate.split('-').map(Number);
      const startObj = new Date(sy, sm - 1, sd);
      return dayOfWeek === String(startObj.getDay());
    }
    return true;
  }
  if (freqType === 'monthly') {
    if (task.specDay !== '' && task.specDay !== undefined) {
      return dayOfMonth === String(task.specDay);
    }
    if (task.startDate) {
      const [, , sd] = task.startDate.split('-').map(Number);
      return dayOfMonth === String(sd);
    }
    return dayOfMonth === '1';
  }
  if (freqType === 'yearly') {
    if (task.startDate) {
      const [, sm, sd] = task.startDate.split('-').map(Number);
      return m === sm && d === sd;
    }
    return m === 1 && d === 1;
  }
  return false;
};

// Sprawdza czy zadanie (jednorazowe lub stałe) ma zaplanowane wykonanie lub przypomnienie w danym dniu
const getTaskStatusForDate = (task, dateStr) => {
  if (task.type === 'one-time') {
    const isDue = task.dueDate === dateStr;
    const isReminder = Boolean(task.reminderDate && task.reminderDate === dateStr);
    return { isScheduled: isDue || isReminder, isDue, isReminder };
  } else {
    const isDue = isRecurringOccurrenceOnDate(task, dateStr);
    let isReminder = false;
    if (
      task.reminderDaysBefore !== '' && 
      task.reminderDaysBefore !== undefined && 
      Number(task.reminderDaysBefore) > 0
    ) {
      const daysBefore = Number(task.reminderDaysBefore);
      const targetOccurrenceDate = addDays(dateStr, daysBefore);
      isReminder = isRecurringOccurrenceOnDate(task, targetOccurrenceDate);
    }
    return { isScheduled: isDue || isReminder, isDue, isReminder };
  }
};

// --- DEFAULT DATA ---

const defaultCategories = [
  { id: 'cat-1', name: 'Praca', color: 'bg-slate-700' },
  { id: 'cat-2', name: 'Dom', color: 'bg-rose-400' },
  { id: 'cat-3', name: 'Stowarzyszenie', color: 'bg-indigo-400' }
];

const defaultTasks = [
  { 
    id: 't-1', 
    title: 'Przygotować materiały na spotkanie zespołu', 
    categoryId: 'cat-1', 
    type: 'one-time',
    dueDate: getTodayString(),
    reminderDate: '',
    completedDates: [] 
  },
  { 
    id: 't-2', 
    title: 'Opłacić ubezpieczenie samochodu', 
    categoryId: 'cat-2', 
    type: 'one-time',
    dueDate: addDays(getTodayString(), 14),
    reminderDate: getTodayString(),
    completedDates: [] 
  },
  { 
    id: 't-3', 
    title: 'Podsumowanie działań zarządu stowarzyszenia', 
    categoryId: 'cat-3', 
    type: 'recurring',
    freqCount: 1,
    freqType: 'weekly',
    specDay: String(new Date().getDay()),
    startDate: getTodayString(),
    reminderDaysBefore: '1',
    completedDates: [] 
  }
];

const defaultHabits = [
  { 
    id: 'h-1', 
    title: 'Wypić minimum 2 litry wody w ciągu dnia', 
    frequency: ['1','2','3','4','5','6','0'], 
    completedDates: [] 
  },
  { 
    id: 'h-2', 
    title: 'Poranny stretching i ćwiczenia oddechowe (15 minut)', 
    frequency: ['1','2','3','4','5'], 
    completedDates: [] 
  }
];

const COLORS = [
  'bg-slate-700', 'bg-rose-400', 'bg-indigo-400', 
  'bg-emerald-400', 'bg-amber-400', 'bg-cyan-600', 'bg-fuchsia-400'
];

const DAYS_OF_WEEK = [
  { id: '1', label: 'Pon', full: 'Poniedziałek' },
  { id: '2', label: 'Wt', full: 'Wtorek' },
  { id: '3', label: 'Śr', full: 'Środa' },
  { id: '4', label: 'Czw', full: 'Czwartek' },
  { id: '5', label: 'Pt', full: 'Piątek' },
  { id: '6', label: 'Sob', full: 'Sobota' },
  { id: '0', label: 'Nd', full: 'Niedziela' }
];

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedPlanDate, setSelectedPlanDate] = useState(getTodayString());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('harmonia_v4_categories');
      return saved ? JSON.parse(saved) : defaultCategories;
    } catch { return defaultCategories; }
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('harmonia_v4_tasks');
      return saved ? JSON.parse(saved) : defaultTasks;
    } catch { return defaultTasks; }
  });

  const [habits, setHabits] = useState(() => {
    try {
      const saved = localStorage.getItem('harmonia_v4_habits');
      return saved ? JSON.parse(saved) : defaultHabits;
    } catch { return defaultHabits; }
  });

  const [toasts, setToasts] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const today = getTodayString();

  // --- EFFECTS (Persistence) ---
  useEffect(() => {
    try { localStorage.setItem('harmonia_v4_categories', JSON.stringify(categories)); } catch (e) {}
  }, [categories]);

  useEffect(() => {
    try { localStorage.setItem('harmonia_v4_tasks', JSON.stringify(tasks)); } catch (e) {}
  }, [tasks]);

  useEffect(() => {
    try { localStorage.setItem('harmonia_v4_habits', JSON.stringify(habits)); } catch (e) {}
  }, [habits]);

  // --- EFFECTS (Reminders on load) ---
  useEffect(() => {
    try {
      const notified = sessionStorage.getItem('notified_reminders') 
        ? JSON.parse(sessionStorage.getItem('notified_reminders')) 
        : [];
      
      let hasNewNotification = false;

      tasks.forEach(task => {
        const status = getTaskStatusForDate(task, today);
        const completed = isTaskCompletedOnDate(task, today);
        if (!completed) {
          if (status.isReminder && !notified.includes(`rem-${task.id}-${today}`)) {
            showNotification(`Przypomnienie: ${task.title} ⏰`);
            notified.push(`rem-${task.id}-${today}`);
            hasNewNotification = true;
          }
          if (status.isDue && !notified.includes(`due-${task.id}-${today}`)) {
            showNotification(`Zaplanowane na dziś: ${task.title}! 📅`);
            notified.push(`due-${task.id}-${today}`);
            hasNewNotification = true;
          }
        }
      });

      if (hasNewNotification) {
        sessionStorage.setItem('notified_reminders', JSON.stringify(notified));
      }
    } catch (e) {
      console.warn('Could not process reminders', e);
    }
  }, [tasks, today]);

  // --- NOTIFICATIONS ---
  const showNotification = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- HELPERS ---
  const isTaskCompletedOnDate = (task, dateStr = today) => {
    if (task.type === 'one-time') {
      return task.completedDates && task.completedDates.length > 0;
    }
    return task.completedDates && task.completedDates.includes(dateStr);
  };

  const toggleTask = (taskId, targetDate = today) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const completed = isTaskCompletedOnDate(task, targetDate);
        let newDates = [...(task.completedDates || [])];
        
        if (completed) {
          if (task.type === 'one-time') newDates = [];
          else newDates = newDates.filter(d => d !== targetDate);
        } else {
          newDates.push(targetDate);
          showNotification(`Ukończono: ${task.title}! 🎉`);
        }
        return { ...task, completedDates: newDates };
      }
      return task;
    }));
  };

  const toggleHabit = (habitId, targetDate = today) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const completed = habit.completedDates.includes(targetDate);
        let newDates = [...habit.completedDates];
        if (completed) {
          newDates = newDates.filter(d => d !== targetDate);
        } else {
          newDates.push(targetDate);
          showNotification(`Nawyk odznaczony: ${habit.title}! 💪`);
        }
        return { ...habit, completedDates: newDates };
      }
      return habit;
    }));
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
    setTasks(tasks.filter(t => t.categoryId !== id));
    showNotification("Kategoria została usunięta.");
  };

  const updateTask = (updatedTask) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEditingTask(null);
    showNotification("Zadanie zostało zaktualizowane.");
  };

  const renderTaskDetailsBadge = (task) => {
    if (task.type === 'one-time') {
      return (
        <div className="text-xs text-slate-500 mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-y-1.5 gap-x-4 items-start sm:items-center leading-relaxed w-full">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <span>Termin: <strong className="text-slate-700 font-semibold whitespace-nowrap">{task.dueDate}</strong></span>
            </span>
          )}
          {task.reminderDate && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <BellRing size={13} className="text-rose-400 shrink-0" />
              <span>Przypomnienie: <strong className="text-rose-500 font-semibold whitespace-nowrap">{task.reminderDate}</strong></span>
            </span>
          )}
        </div>
      );
    } else {
      const freqMap = { daily: 'dzień', weekly: 'tydzień', monthly: 'miesiąc', yearly: 'rok' };
      const dayMap = { '1': 'Pon', '2': 'Wt', '3': 'Śr', '4': 'Czw', '5': 'Pt', '6': 'Sob', '0': 'Nd' };
      
      let detail = `${task.freqCount || 1}x na ${freqMap[task.freqType] || 'tydzień'}`;
      
      if (task.specDay !== '' && task.specDay !== undefined) {
        if (task.freqType === 'weekly') detail += ` (${dayMap[task.specDay]})`;
        else if (task.freqType === 'monthly') detail += ` (${task.specDay}. dzień mies.)`;
      }
      
      return (
        <div className="text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1.5 items-center leading-relaxed w-full">
          <span className="uppercase tracking-wider font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 whitespace-nowrap">
            <Repeat size={11} className="shrink-0" /> <span>{detail}</span>
          </span>
          {task.startDate && (
            <span className="text-slate-500 whitespace-nowrap">
              Start: <strong className="text-slate-700 font-semibold whitespace-nowrap">{task.startDate}</strong>
            </span>
          )}
          {task.reminderDaysBefore !== '' && task.reminderDaysBefore !== undefined && (
            <span className="text-slate-500 whitespace-nowrap">
              Przypomn.: <strong className="text-rose-500 font-semibold whitespace-nowrap">{task.reminderDaysBefore} dni przed</strong>
            </span>
          )}
        </div>
      );
    }
  };

  // --- NAVIGATION COMPONENTS ---

  const Sidebar = () => (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0 hidden md:flex rounded-l-2xl">
      <div className="p-6 text-2xl font-light text-white tracking-wide border-b border-slate-800 flex items-center gap-3">
        <YinYangLogo className="w-7 h-7" />
        <span className="text-[#F9B8C9] font-normal">Harmonia</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavItem id="daily" icon={<Calendar size={20} />} label="Plan dnia" />
        <NavItem id="tasks" icon={<ListTodo size={20} />} label="Zadania" />
        <NavItem id="habits" icon={<Activity size={20} />} label="Nawyki" />
        <NavItem id="stats" icon={<BarChart3 size={20} />} label="Podsumowanie" />
        <NavItem id="settings" icon={<Settings size={20} />} label="Ustawienia" />
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        Twój Osobisty Planer Dnia
      </div>
    </div>
  );

  const NavItem = ({ id, icon, label }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
          active 
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm' 
            : 'hover:bg-slate-800 hover:text-white'
        }`}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  // --- DELETE CONFIRMATION MODAL ---
  const DeleteConfirmModal = () => {
    if (!itemToDelete) return null;

    const handleConfirm = () => {
      if (itemToDelete.type === 'task') {
        setTasks(tasks.filter(t => t.id !== itemToDelete.id));
        showNotification("Zadanie zostało usunięte.");
      } else if (itemToDelete.type === 'habit') {
        setHabits(habits.filter(h => h.id !== itemToDelete.id));
        showNotification("Nawyk został usunięty.");
      } else if (itemToDelete.type === 'category') {
        deleteCategory(itemToDelete.id);
      }
      setItemToDelete(null);
    };

    const getModalQuestion = () => {
      if (itemToDelete.type === 'task') return 'Czy usunąć zadanie?';
      if (itemToDelete.type === 'category') return 'Czy usunąć kategorię?';
      return 'Czy usunąć nawyk?';
    };

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 fade-in">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-slate-100">
          <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={30} />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {getModalQuestion()}
          </h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {itemToDelete.type === 'category' 
              ? 'Usunięcie kategorii spowoduje również usunięcie przypisanych do niej zadań.' 
              : 'Tej operacji nie można cofnąć.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => setItemToDelete(null)} 
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Nie
            </button>
            <button 
              onClick={handleConfirm} 
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-400 hover:bg-rose-500 rounded-xl transition-colors shadow-sm"
            >
              Tak
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- EDIT TASK MODAL ---
  const EditTaskModal = () => {
    if (!editingTask) return null;

    const [formState, setFormState] = useState({ ...editingTask });

    const handleChange = (field, value) => {
      setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = (e) => {
      e.preventDefault();
      const finalTask = { ...formState };
      if (finalTask.type === 'one-time') {
        delete finalTask.freqCount;
        delete finalTask.freqType;
        delete finalTask.specDay;
        delete finalTask.startDate;
        delete finalTask.reminderDaysBefore;
      } else {
        delete finalTask.dueDate;
        delete finalTask.reminderDate;
      }
      updateTask(finalTask);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 fade-in">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-semibold text-slate-800 text-lg">Edytuj zadanie i terminy</h3>
            <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            <form id="edit-form" onSubmit={handleSave} className="space-y-5">
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nazwa / opis zadania</label>
                <textarea 
                  rows={2}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-800 resize-y"
                  value={formState.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Kategoria</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-800"
                  value={formState.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="editTaskType" 
                    value="one-time" 
                    checked={formState.type === 'one-time'} 
                    onChange={() => handleChange('type', 'one-time')} 
                    className="text-indigo-500 focus:ring-indigo-400" 
                  />
                  <span className="text-sm font-medium text-slate-700">Jednorazowe</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="editTaskType" 
                    value="recurring" 
                    checked={formState.type === 'recurring'} 
                    onChange={() => {
                      handleChange('type', 'recurring');
                      if (!formState.freqType) handleChange('freqType', 'weekly');
                      if (!formState.freqCount) handleChange('freqCount', 1);
                      if (!formState.startDate) handleChange('startDate', today);
                    }} 
                    className="text-indigo-500 focus:ring-indigo-400" 
                  />
                  <span className="text-sm font-medium text-slate-700">Stałe (Powtarzalne)</span>
                </label>
              </div>

              {formState.type === 'one-time' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-rose-50/40 p-4 rounded-xl border border-rose-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Termin wykonania</label>
                    <input 
                      type="date" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                      value={formState.dueDate || ''} 
                      onChange={(e) => handleChange('dueDate', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Przypomnienie</label>
                    <div className="flex flex-col gap-2">
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700" 
                        value={formState.reminderDate === '' || formState.reminderDate === undefined ? 'none' : 'date'} 
                        onChange={(e) => handleChange('reminderDate', e.target.value === 'none' ? '' : today)}
                      >
                        <option value="none">Brak</option>
                        <option value="date">Wybierz datę</option>
                      </select>
                      {(formState.reminderDate !== '' && formState.reminderDate !== undefined) && (
                        <input 
                          type="date" 
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                          value={formState.reminderDate || ''} 
                          onChange={(e) => handleChange('reminderDate', e.target.value)} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {formState.type === 'recurring' && (
                <div className="space-y-4 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Data startu</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                        value={formState.startDate || ''} 
                        onChange={(e) => handleChange('startDate', e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Przypomnienie (przed terminem)</label>
                      <div className="flex gap-2">
                        <select 
                          className="w-1/2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700" 
                          value={formState.reminderDaysBefore === '' || formState.reminderDaysBefore === undefined ? 'none' : 'days'} 
                          onChange={(e) => handleChange('reminderDaysBefore', e.target.value === 'none' ? '' : 1)}
                        >
                          <option value="none">Brak</option>
                          <option value="days">Dni przed</option>
                        </select>
                        {(formState.reminderDaysBefore !== '' && formState.reminderDaysBefore !== undefined) && (
                          <input 
                            type="number" 
                            min="0" 
                            placeholder="np. 2" 
                            className="w-1/2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                            value={formState.reminderDaysBefore !== undefined ? formState.reminderDaysBefore : ''} 
                            onChange={(e) => handleChange('reminderDaysBefore', e.target.value)} 
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Ilość razy</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                        value={formState.freqCount || 1} 
                        onChange={(e) => handleChange('freqCount', e.target.value)} 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Częstotliwość (na)</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                        value={formState.freqType || 'weekly'} 
                        onChange={(e) => { handleChange('freqType', e.target.value); handleChange('specDay', ''); }}
                      >
                        <option value="daily">Dzień</option>
                        <option value="weekly">Tydzień</option>
                        <option value="monthly">Miesiąc</option>
                        <option value="yearly">Rok</option>
                      </select>
                    </div>
                  </div>
                  
                  {(formState.freqType === 'weekly' || formState.freqType === 'monthly') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Wybierz dzień tygodnia lub miesiąca</label>
                      <select 
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" 
                        value={formState.specDay || ''} 
                        onChange={(e) => handleChange('specDay', e.target.value)}
                      >
                        <option value="">Dowolny / wg daty startu</option>
                        {formState.freqType === 'weekly' && (
                          <>
                            <option value="1">Poniedziałek</option>
                            <option value="2">Wtorek</option>
                            <option value="3">Środa</option>
                            <option value="4">Czwartek</option>
                            <option value="5">Piątek</option>
                            <option value="6">Sobota</option>
                            <option value="0">Niedziela</option>
                          </>
                        )}
                        {formState.freqType === 'monthly' && Array.from({length: 31}, (_, i) => (
                          <option key={i+1} value={i+1}>{i+1}. dzień miesiąca</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={() => setEditingTask(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
              Anuluj
            </button>
            <button type="submit" form="edit-form" className="px-6 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors flex items-center gap-2">
              <Save size={16} /> Zapisz zmiany
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- EDIT HABIT MODAL ---
  const EditHabitModal = () => {
    if (!editingHabit) return null;

    const [formState, setFormState] = useState({ 
      ...editingHabit, 
      frequency: editingHabit.frequency || ['1','2','3','4','5','6','0'] 
    });

    const isEveryday = formState.frequency.length === 7;

    const toggleDay = (id) => {
      if (formState.frequency.includes(id)) {
        setFormState({ ...formState, frequency: formState.frequency.filter(d => d !== id) });
      } else {
        setFormState({ ...formState, frequency: [...formState.frequency, id] });
      }
    };

    const toggleEveryday = () => {
      if (isEveryday) setFormState({ ...formState, frequency: [] });
      else setFormState({ ...formState, frequency: ['1','2','3','4','5','6','0'] });
    };

    const handleSave = (e) => {
      e.preventDefault();
      if (formState.frequency.length === 0) {
        showNotification("Wybierz przynajmniej jeden dzień tygodnia dla nawyku.");
        return;
      }
      setHabits(habits.map(h => h.id === formState.id ? formState : h));
      setEditingHabit(null);
      showNotification("Nawyk został zaktualizowany.");
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 fade-in">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-semibold text-slate-800 text-lg">Edytuj nawyk</h3>
            <button onClick={() => setEditingHabit(null)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto">
            <form id="edit-habit-form" onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nazwa nawyku</label>
                <textarea 
                  rows={2}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-300 text-slate-800 resize-y"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Wybierz dni tygodnia</label>
                <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-100 space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                    <input 
                      type="checkbox" 
                      checked={isEveryday} 
                      onChange={toggleEveryday} 
                      className="text-rose-500 focus:ring-rose-400 rounded w-4 h-4" 
                    />
                    Codziennie
                  </label>
                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-rose-100">
                    {DAYS_OF_WEEK.map(day => (
                      <label key={day.id} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <input 
                          type="checkbox" 
                          checked={formState.frequency.includes(day.id)} 
                          onChange={() => toggleDay(day.id)} 
                          className="text-rose-500 focus:ring-rose-400 rounded" 
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={() => setEditingHabit(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
              Anuluj
            </button>
            <button type="submit" form="edit-habit-form" className="px-6 py-2 text-sm font-medium text-white bg-rose-400 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-2">
              <Save size={16} /> Zapisz zmiany
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- VIEW 1: PLAN DNIA (DAILY PLAN) ---
  const DailyPlanView = () => {
    const [quickTitle, setQuickTitle] = useState('');
    const [quickCat, setQuickCat] = useState(categories[0]?.id || '');

    const [y, m, d] = selectedPlanDate.split('-').map(Number);
    const selectedDateObj = new Date(y, m - 1, d);
    const dayOfWeekStr = String(selectedDateObj.getDay());

    // Filtruj zadania zaplanowane na wybrany dzień (wykonanie lub przypomnienie)
    const scheduledTasks = tasks
      .map(task => {
        const status = getTaskStatusForDate(task, selectedPlanDate);
        return { task, ...status };
      })
      .filter(item => item.isScheduled);

    // Filtruj nawyki zaplanowane na wybrany dzień tygodnia
    const scheduledHabits = habits.filter(h => 
      (h.frequency || ['1','2','3','4','5','6','0']).includes(dayOfWeekStr)
    );

    const completedTasksCount = scheduledTasks.filter(item => isTaskCompletedOnDate(item.task, selectedPlanDate)).length;
    const completedHabitsCount = scheduledHabits.filter(h => h.completedDates.includes(selectedPlanDate)).length;
    const totalCount = scheduledTasks.length + scheduledHabits.length;
    const totalCompleted = completedTasksCount + completedHabitsCount;
    const dayProgress = totalCount === 0 ? 0 : Math.round((totalCompleted / totalCount) * 100);

    const handleQuickAddForDay = (e) => {
      e.preventDefault();
      if (!quickTitle.trim() || !quickCat) return;
      const newTask = {
        id: `t-${Date.now()}`,
        title: quickTitle,
        categoryId: quickCat,
        type: 'one-time',
        dueDate: selectedPlanDate,
        reminderDate: '',
        completedDates: []
      };
      setTasks([...tasks, newTask]);
      setQuickTitle('');
      showNotification(`Dodano zadanie na ${selectedPlanDate}!`);
    };

    return (
      <div className="space-y-6 fade-in">
        {/* Top Header & Date Selector */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-500">
                {selectedPlanDate === today ? 'Dzisiaj' : 'Wybrany dzień'}
              </span>
              <span className="text-xs text-slate-400">{selectedPlanDate}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1.5 capitalize whitespace-normal break-words leading-snug">
              {formatPolishDate(selectedPlanDate)}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedPlanDate(addDays(selectedPlanDate, -1))}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="Poprzedni dzień"
            >
              <ChevronLeft size={18} />
            </button>
            
            <button
              onClick={() => setSelectedPlanDate(today)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                selectedPlanDate === today
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Dzisiaj
            </button>

            <button
              onClick={() => setSelectedPlanDate(addDays(selectedPlanDate, 1))}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="Następny dzień"
            >
              <ChevronRight size={18} />
            </button>

            <div className="relative flex items-center">
              <input
                type="date"
                value={selectedPlanDate}
                onChange={(e) => e.target.value && setSelectedPlanDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-indigo-300 font-medium">Postęp planu dnia</p>
            <h3 className="text-base sm:text-lg font-semibold whitespace-normal break-words">
              Ukończono {totalCompleted} z {totalCount} zaplanowanych pozycji ({dayProgress}%)
            </h3>
          </div>
          <div className="w-full sm:w-56 bg-slate-700/60 h-3 rounded-full p-0.5 shrink-0">
            <div 
              className="bg-gradient-to-r from-indigo-400 to-rose-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
        </div>

        {/* Szybkie dodawanie zadania na wybrany dzień */}
        <form onSubmit={handleQuickAddForDay} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={`Szybkie zadanie na ${selectedPlanDate}...`}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select
            value={quickCat}
            onChange={(e) => setQuickCat(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none sm:w-44"
          >
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            type="submit"
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={16} /> Dodaj na ten dzień
          </button>
        </form>

        {/* Sekcja Zadań na wybrany dzień */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ListTodo size={20} className="text-indigo-500 shrink-0" />
            <span>Zadania do wykonania ({scheduledTasks.length})</span>
          </h3>

          {scheduledTasks.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-2">
              <Sparkles className="mx-auto text-indigo-300" size={32} />
              <p className="text-slate-600 font-medium">Brak zaplanowanych zadań na ten dzień</p>
              <p className="text-xs text-slate-400">Możesz dodać nowe zadanie powyżej lub przejść do zakładki „Zadania”.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map(category => {
                const catItems = scheduledTasks.filter(item => item.task.categoryId === category.id);
                if (catItems.length === 0) return null;

                return (
                  <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 rounded-t-2xl">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${category.color}`}></span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-normal break-words">
                        {category.name}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {catItems.map(({ task, isDue, isReminder }) => {
                        const completed = isTaskCompletedOnDate(task, selectedPlanDate);
                        return (
                          <div key={task.id} className="flex flex-col p-4 hover:bg-slate-50/80 transition-colors group">
                            <div className="flex items-start gap-3.5 w-full">
                              <button 
                                onClick={() => toggleTask(task.id, selectedPlanDate)} 
                                className="focus:outline-none shrink-0 mt-0.5"
                              >
                                {completed 
                                  ? <CheckCircle2 className="text-emerald-400 w-6 h-6" /> 
                                  : <Circle className="text-slate-300 w-6 h-6 group-hover:text-indigo-400 transition-colors" />}
                              </button>
                              <div className="flex flex-col flex-1 w-full min-w-0">
                                <span className={`font-medium text-base w-full whitespace-normal break-words leading-snug ${completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  {isDue && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                                      Termin wykonania
                                    </span>
                                  )}
                                  {isReminder && !isDue && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-500 flex items-center gap-1">
                                      <Clock size={10} className="shrink-0" /> Przypomnienie
                                    </span>
                                  )}
                                </div>
                                {renderTaskDetailsBadge(task)}
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-3 pt-2.5 border-t border-slate-100 w-full">
                              <button 
                                onClick={() => setEditingTask(task)} 
                                className="text-slate-400 hover:text-indigo-500 px-2.5 py-1 rounded-lg hover:bg-indigo-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium" 
                                title="Zmień termin / Edytuj"
                              >
                                <Edit3 size={16} />
                                <span>Edytuj</span>
                              </button>
                              <button 
                                onClick={() => setItemToDelete({ id: task.id, type: 'task' })} 
                                className="text-slate-400 hover:text-rose-500 px-2.5 py-1 rounded-lg hover:bg-rose-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium" 
                                title="Usuń"
                              >
                                <Trash2 size={16} />
                                <span>Usuń</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sekcja Nawyków na wybrany dzień */}
        <div className="space-y-4 pt-2">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-rose-400 shrink-0" />
            <span>Nawyki na ten dzień ({scheduledHabits.length})</span>
          </h3>

          {scheduledHabits.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-sm text-slate-400">
              Brak nawyków zaplanowanych na ten dzień tygodnia.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scheduledHabits.map(habit => {
                const completed = habit.completedDates.includes(selectedPlanDate);
                return (
                  <div 
                    key={habit.id} 
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 w-full">
                      <button
                        onClick={() => toggleHabit(habit.id, selectedPlanDate)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                          completed 
                            ? 'bg-rose-400 text-white shadow-sm shadow-rose-200' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <div className="flex-1 w-full min-w-0">
                        <p className={`font-medium w-full whitespace-normal break-words leading-snug ${completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {habit.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {completed ? 'Wykonano w tym dniu' : 'Do wykonania'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-3 pt-2.5 border-t border-slate-100 w-full">
                      <button 
                        onClick={() => setEditingHabit(habit)} 
                        className="text-slate-400 hover:text-rose-500 px-2.5 py-1 rounded-lg hover:bg-rose-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium"
                        title="Edytuj nawyk"
                      >
                        <Edit3 size={16} />
                        <span>Edytuj</span>
                      </button>
                      <button 
                        onClick={() => setItemToDelete({ id: habit.id, type: 'habit' })} 
                        className="text-slate-400 hover:text-rose-500 px-2.5 py-1 rounded-lg hover:bg-rose-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium"
                        title="Usuń nawyk"
                      >
                        <Trash2 size={16} />
                        <span>Usuń</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- VIEW 2: ZADANIA (ALL TASKS) ---
  const TasksView = () => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCat, setNewTaskCat] = useState(categories[0]?.id || '');
    const [taskType, setTaskType] = useState('one-time');
    const [filterCategory, setFilterCategory] = useState('all');
    
    // Pola dla zadań jednorazowych
    const [dueDate, setDueDate] = useState(today);
    const [reminderDate, setReminderDate] = useState('');
    
    // Pola dla zadań stałych
    const [freqCount, setFreqCount] = useState(1);
    const [freqType, setFreqType] = useState('weekly');
    const [specDay, setSpecDay] = useState('');
    const [startDate, setStartDate] = useState(today);
    const [reminderDaysBefore, setReminderDaysBefore] = useState('');

    const handleAddTask = (e) => {
      e.preventDefault();
      if (!newTaskTitle.trim() || !newTaskCat) return;
      
      const newTask = {
        id: `t-${Date.now()}`,
        title: newTaskTitle,
        categoryId: newTaskCat,
        type: taskType,
        completedDates: []
      };

      if (taskType === 'one-time') {
        newTask.dueDate = dueDate;
        newTask.reminderDate = reminderDate;
      } else {
        newTask.freqCount = freqCount;
        newTask.freqType = freqType;
        newTask.specDay = specDay;
        newTask.startDate = startDate;
        newTask.reminderDaysBefore = reminderDaysBefore;
      }

      setTasks([...tasks, newTask]);
      
      setNewTaskTitle('');
      setDueDate(today);
      setReminderDate('');
      setFreqCount(1);
      setFreqType('weekly');
      setSpecDay('');
      setStartDate(today);
      setReminderDaysBefore('');
      
      showNotification("Dodano nowe zadanie!");
    };

    const visibleCategories = filterCategory === 'all' 
      ? categories 
      : categories.filter(c => c.id === filterCategory);

    return (
      <div className="space-y-6 fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-800">Wszystkie Zadania</h2>
          
          {/* Filtr kategorii */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filterCategory === 'all' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Wszystkie
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  filterCategory === cat.id 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${cat.color}`}></span>
                <span className="whitespace-normal break-words">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Formularz dodawania nowego zadania */}
        <form onSubmit={handleAddTask} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Co masz do zrobienia? (np. Opłacić ubezpieczenie samochodu)" 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <select 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none md:w-52"
              value={newTaskCat}
              onChange={(e) => setNewTaskCat(e.target.value)}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-b border-slate-100 pb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="taskType" 
                value="one-time" 
                checked={taskType === 'one-time'} 
                onChange={() => setTaskType('one-time')} 
                className="text-indigo-500 focus:ring-indigo-400" 
              />
              <span className="text-sm font-medium text-slate-700">Zadanie jednorazowe</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="taskType" 
                value="recurring" 
                checked={taskType === 'recurring'} 
                onChange={() => setTaskType('recurring')} 
                className="text-indigo-500 focus:ring-indigo-400" 
              />
              <span className="text-sm font-medium text-slate-700">Zadanie stałe</span>
            </label>
          </div>

          {/* Pola dla zadania jednorazowego */}
          {taskType === 'one-time' && (
            <div className="flex flex-col sm:flex-row gap-4 bg-rose-50/30 p-4 rounded-xl border border-rose-100/80">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Termin wykonania</label>
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-slate-700" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Termin przypomnienia</label>
                <div className="flex gap-2">
                  <select 
                    className="w-1/3 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-slate-700" 
                    value={reminderDate === '' ? 'none' : 'date'} 
                    onChange={(e) => setReminderDate(e.target.value === 'none' ? '' : today)}
                  >
                    <option value="none">Brak</option>
                    <option value="date">Wybierz datę</option>
                  </select>
                  {reminderDate !== '' && (
                    <input 
                      type="date" 
                      className="w-2/3 bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-slate-700" 
                      value={reminderDate} 
                      onChange={(e) => setReminderDate(e.target.value)} 
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pola dla zadania stałego */}
          {taskType === 'recurring' && (
            <div className="space-y-4 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/80">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Data startu</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-slate-700" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Przypomnienie (przypomnij za ilość dni przed)</label>
                  <div className="flex gap-2">
                    <select 
                      className="w-1/3 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-slate-700" 
                      value={reminderDaysBefore === '' ? 'none' : 'days'} 
                      onChange={(e) => setReminderDaysBefore(e.target.value === 'none' ? '' : 1)}
                    >
                      <option value="none">Brak</option>
                      <option value="days">Ilość dni</option>
                    </select>
                    {reminderDaysBefore !== '' && (
                      <input 
                        type="number" 
                        min="0" 
                        placeholder="np. 3 dni" 
                        className="w-2/3 bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-slate-700" 
                        value={reminderDaysBefore} 
                        onChange={(e) => setReminderDaysBefore(e.target.value)} 
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-32">
                  <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Ilość razy</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm" 
                    value={freqCount} 
                    onChange={(e) => setFreqCount(e.target.value)} 
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Częstotliwość (na dzień, tydzień, miesiąc, rok)</label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none text-sm text-slate-700" 
                    value={freqType} 
                    onChange={(e) => { setFreqType(e.target.value); setSpecDay(''); }}
                  >
                    <option value="daily">Dzień</option>
                    <option value="weekly">Tydzień</option>
                    <option value="monthly">Miesiąc</option>
                    <option value="yearly">Rok</option>
                  </select>
                </div>
                {(freqType === 'weekly' || freqType === 'monthly') && (
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">
                      {freqType === 'weekly' ? 'Dzień tygodnia' : 'Dzień miesiąca'}
                    </label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none text-sm text-slate-700" 
                      value={specDay} 
                      onChange={(e) => setSpecDay(e.target.value)}
                    >
                      <option value="">Dowolny / wg daty startu</option>
                      {freqType === 'weekly' && (
                        <>
                          <option value="1">Poniedziałek</option>
                          <option value="2">Wtorek</option>
                          <option value="3">Środa</option>
                          <option value="4">Czwartek</option>
                          <option value="5">Piątek</option>
                          <option value="6">Sobota</option>
                          <option value="0">Niedziela</option>
                        </>
                      )}
                      {freqType === 'monthly' && Array.from({length: 31}, (_, i) => (
                        <option key={i+1} value={i+1}>{i+1}. dzień miesiąca</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 sm:self-start font-medium shadow-sm"
          >
            <Plus size={18} /> Dodaj Zadanie
          </button>
        </form>

        {/* Lista zadań wg kategorii */}
        <div className="space-y-8">
          {visibleCategories.map(category => {
            const catTasks = tasks.filter(t => t.categoryId === category.id);
            if (catTasks.length === 0) return null;

            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${category.color}`}></span>
                  <h3 className="font-semibold text-slate-700 whitespace-normal break-words">{category.name}</h3>
                  <span className="text-xs text-slate-400">({catTasks.length})</span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
                  {catTasks.map(task => {
                    const completed = isTaskCompletedOnDate(task, today);
                    return (
                      <div key={task.id} className="flex flex-col p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start gap-3.5 w-full">
                          <button onClick={() => toggleTask(task.id, today)} className="focus:outline-none shrink-0 mt-0.5">
                            {completed 
                              ? <CheckCircle2 className="text-emerald-400 w-6 h-6" /> 
                              : <Circle className="text-slate-300 w-6 h-6 group-hover:text-indigo-400 transition-colors" />}
                          </button>
                          <div className="flex flex-col flex-1 w-full min-w-0">
                            <span className={`font-medium text-base w-full whitespace-normal break-words leading-snug ${completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.title}
                            </span>
                            {renderTaskDetailsBadge(task)}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-3 pt-2.5 border-t border-slate-100 w-full">
                          <button 
                            onClick={() => setEditingTask(task)} 
                            className="text-slate-400 hover:text-indigo-500 px-2.5 py-1 rounded-lg hover:bg-indigo-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium" 
                            title="Zmień termin / Edytuj"
                          >
                            <Edit3 size={16} />
                            <span>Edytuj</span>
                          </button>
                          <button 
                            onClick={() => setItemToDelete({ id: task.id, type: 'task' })} 
                            className="text-slate-400 hover:text-rose-500 px-2.5 py-1 rounded-lg hover:bg-rose-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium" 
                            title="Usuń zadanie"
                          >
                            <Trash2 size={16} />
                            <span>Usuń</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- VIEW 3: NAWYKI (HABITS) ---
  const HabitsView = () => {
    const [newHabit, setNewHabit] = useState('');
    const [newHabitFreq, setNewHabitFreq] = useState(['1','2','3','4','5','6','0']);

    const isEveryday = newHabitFreq.length === 7;

    const toggleDay = (id) => {
      if (newHabitFreq.includes(id)) setNewHabitFreq(newHabitFreq.filter(d => d !== id));
      else setNewHabitFreq([...newHabitFreq, id]);
    };

    const toggleEveryday = () => {
      if (isEveryday) setNewHabitFreq([]);
      else setNewHabitFreq(['1','2','3','4','5','6','0']);
    };

    const handleAdd = (e) => {
      e.preventDefault();
      if (!newHabit.trim() || newHabitFreq.length === 0) {
        showNotification("Podaj nazwę nawyku i zaznacz przynajmniej jeden dzień tygodnia.");
        return;
      }
      setHabits([...habits, { id: `h-${Date.now()}`, title: newHabit, frequency: newHabitFreq, completedDates: [] }]);
      setNewHabit('');
      setNewHabitFreq(['1','2','3','4','5','6','0']);
      showNotification("Dodano nowy nawyk!");
    };

    const formatFreq = (freq) => {
      if (!freq || freq.length === 7) return 'Codziennie';
      if (freq.length === 0) return 'Brak wybranych dni';
      return DAYS_OF_WEEK.filter(d => freq.includes(d.id)).map(d => d.label).join(', ');
    };

    return (
      <div className="space-y-6 fade-in">
        <h2 className="text-2xl font-semibold text-slate-800">Praca nad Nawykami</h2>
        
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Jaki nawyk chcesz wypracować?" 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-300"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
            />
            <button type="submit" className="bg-rose-400 text-white px-6 py-2.5 rounded-xl hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 font-medium shrink-0">
              <Plus size={18} /> Dodaj Nawyk
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-rose-50/30 p-3.5 rounded-xl border border-rose-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Wybór dni:</span>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm">
              <input 
                type="checkbox" 
                checked={isEveryday} 
                onChange={toggleEveryday} 
                className="text-rose-500 focus:ring-rose-400 rounded w-4 h-4" 
              />
              Codziennie
            </label>
            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
            <div className="flex flex-wrap gap-2.5">
              {DAYS_OF_WEEK.map(day => (
                <label key={day.id} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newHabitFreq.includes(day.id)} 
                    onChange={() => toggleDay(day.id)} 
                    className="text-rose-500 focus:ring-rose-400 rounded" 
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map(habit => {
            const completed = habit.completedDates.includes(today);
            const streak = habit.completedDates.length;
            return (
              <div key={habit.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-slate-200 transition-colors">
                <div className="flex items-start gap-3.5 w-full">
                  <button 
                    onClick={() => toggleHabit(habit.id, today)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      completed ? 'bg-rose-400 text-white shadow-md shadow-rose-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 size={24} />
                  </button>
                  <div className="flex-1 w-full min-w-0">
                    <h3 className={`font-medium text-base w-full whitespace-normal break-words leading-snug ${completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {habit.title}
                    </h3>
                    <div className="text-xs text-slate-400 mt-1.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
                      <span>Ukończono dni: <strong className="text-slate-600">{streak}</strong></span>
                      <span>•</span>
                      <span className="text-rose-400 font-medium whitespace-normal break-words">{formatFreq(habit.frequency)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-3 pt-2.5 border-t border-slate-100 w-full">
                  <button 
                    onClick={() => setEditingHabit(habit)} 
                    className="text-slate-400 hover:text-rose-500 px-2.5 py-1 rounded-lg hover:bg-rose-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium" 
                    title="Edytuj"
                  >
                    <Edit3 size={16} />
                    <span>Edytuj</span>
                  </button>
                  <button 
                    onClick={() => setItemToDelete({ id: habit.id, type: 'habit' })} 
                    className="text-slate-400 hover:text-rose-500 px-2.5 py-1 rounded-lg hover:bg-rose-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium" 
                    title="Usuń"
                  >
                    <Trash2 size={16} />
                    <span>Usuń</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- VIEW 4: STATYSTYKI I PODSUMOWANIE DNIA ---
  const StatsView = () => {
    const todayTasks = tasks.filter(t => getTaskStatusForDate(t, today).isScheduled);
    const completedTodayTasks = todayTasks.filter(t => isTaskCompletedOnDate(t, today)).length;
    const tasksProgress = todayTasks.length === 0 ? 0 : Math.round((completedTodayTasks / todayTasks.length) * 100);
    
    const todayDayOfWeek = String(new Date().getDay());
    const todayHabits = habits.filter(h => (h.frequency || ['1','2','3','4','5','6','0']).includes(todayDayOfWeek));
    const completedTodayHabits = todayHabits.filter(h => h.completedDates.includes(today)).length;
    const habitsProgress = todayHabits.length === 0 ? 0 : Math.round((completedTodayHabits / todayHabits.length) * 100);

    const circumference = 251.2; // 2 * PI * 40

    return (
      <div className="space-y-6 fade-in">
        <h2 className="text-2xl font-semibold text-slate-800">Statystyki i Podsumowanie Dnia</h2>
        
        <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          {/* Układ z dwoma wykresami obok siebie i kwadratami pod każdym z nich */}
          <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-2xl mx-auto">
            
            {/* KOLUMNA LEWA: ZADANIA */}
            <div className="flex flex-col items-center">
              {/* Wykres kołowy Zadań */}
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 mb-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke="url(#tasksGradient)" 
                    strokeWidth="8" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={circumference - (circumference * tasksProgress) / 100}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="tasksGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center px-2">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-700">{tasksProgress}%</span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium">zadań dziś</span>
                </div>
              </div>

              {/* Kwadrat pod wykresem zadań */}
              <div className="w-full aspect-square max-w-[180px] bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-[11px] sm:text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold leading-snug">
                  Zadania na dziś
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {completedTodayTasks} <span className="text-lg sm:text-xl text-slate-400 font-normal">/ {todayTasks.length}</span>
                </p>
              </div>
            </div>

            {/* KOLUMNA PRAWA: NAWYKI */}
            <div className="flex flex-col items-center">
              {/* Wykres kołowy Nawyków */}
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 mb-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke="url(#habitsGradient)" 
                    strokeWidth="8" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={circumference - (circumference * habitsProgress) / 100}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="habitsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F9B8C9" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center px-2">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-700">{habitsProgress}%</span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium">nawyków dziś</span>
                </div>
              </div>

              {/* Kwadrat pod wykresem nawyków */}
              <div className="w-full aspect-square max-w-[180px] bg-rose-50/40 p-4 rounded-2xl border border-rose-100/80 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-[11px] sm:text-xs uppercase tracking-wider text-rose-400 mb-2 font-semibold leading-snug">
                  Nawyki na dziś
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">
                  {completedTodayHabits} <span className="text-lg sm:text-xl text-slate-400 font-normal">/ {todayHabits.length}</span>
                </p>
              </div>
            </div>

            {/* PROSTOKĄT POD SPODEM: WSZYSTKIE ZADANIA W BAZIE */}
            <div className="col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center mt-2">
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">
                Wszystkie zadania w bazie
              </p>
              <p className="text-3xl font-bold text-indigo-500">{tasks.length}</p>
            </div>

          </div>
        </div>

        {/* Statystyki wg kategorii */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-semibold text-slate-700">Podział zadań według kategorii</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map(cat => {
              const catTasks = tasks.filter(t => t.categoryId === cat.id);
              const catCompleted = catTasks.filter(t => isTaskCompletedOnDate(t, today)).length;
              return (
                <div key={cat.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${cat.color}`}></span>
                    <span className="font-medium text-slate-700 whitespace-normal break-words">{cat.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-600 shrink-0">
                    {catCompleted}/{catTasks.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- VIEW 5: USTAWIENIA & KATEGORIE ---
  const SettingsView = () => {
    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState(COLORS[0]);

    const handleAddCategory = (e) => {
      e.preventDefault();
      if (!newCatName.trim()) return;
      setCategories([...categories, { id: `cat-${Date.now()}`, name: newCatName, color: newCatColor }]);
      setNewCatName('');
      showNotification("Nowa kategoria została dodana!");
    };

    return (
      <div className="space-y-6 fade-in">
        <h2 className="text-2xl font-semibold text-slate-800">Ustawienia & Kategorie</h2>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-lg font-medium text-slate-700 border-b border-slate-100 pb-4">Zarządzaj Kategoriami (Praca, Dom, Stowarzyszenie i inne)</h3>
          
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Nazwa nowej kategorii..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 overflow-x-auto">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCatColor(color)}
                  className={`w-6 h-6 rounded-full shrink-0 ${color} ${newCatColor === color ? 'ring-2 ring-offset-2 ring-slate-400' : 'opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
            <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-xl hover:bg-slate-700 transition-colors font-medium shrink-0">
              Dodaj kategorię
            </button>
          </form>

          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`w-4 h-4 rounded-full shrink-0 ${cat.color}`}></span>
                  <span className="font-medium text-slate-700 whitespace-normal break-words leading-snug">{cat.name}</span>
                </div>
                {categories.length > 1 && (
                  <button 
                    onClick={() => setItemToDelete({ id: cat.id, type: 'category' })} 
                    className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors shrink-0"
                    title="Usuń kategorię"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            * Przed usunięciem kategorii pojawi się okno z pytaniem potwierdzającym.
          </p>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden p-0 md:p-4 font-sans selection:bg-indigo-100">
      <div className="flex w-full max-w-6xl mx-auto bg-[#f8fafc] md:bg-white md:shadow-xl md:rounded-2xl overflow-hidden border-slate-100 md:border">
        
        <Sidebar />

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-20 shadow-md">
          <div className="flex items-center gap-2.5 font-medium text-lg">
            <YinYangLogo className="w-6 h-6" />
            <span className="text-[#F9B8C9]">Harmonia</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed top-16 left-0 right-0 bg-slate-900 border-b border-slate-700 z-50 p-4 space-y-2 shadow-lg">
            <NavItem id="daily" icon={<Calendar size={20} />} label="Plan dnia" />
            <NavItem id="tasks" icon={<ListTodo size={20} />} label="Zadania" />
            <NavItem id="habits" icon={<Activity size={20} />} label="Nawyki" />
            <NavItem id="stats" icon={<BarChart3 size={20} />} label="Podsumowanie" />
            <NavItem id="settings" icon={<Settings size={20} />} label="Ustawienia" />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto pt-20 md:pt-0 p-4 md:p-10 relative">
          
          <header className="mb-8 hidden md:flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-slate-400 font-medium text-xs tracking-wider uppercase mb-1">Dzisiejsza data</p>
              <h1 className="text-2xl font-bold text-slate-800 capitalize">
                {formatPolishDate(today)}
              </h1>
            </div>
            <button
              onClick={() => { setActiveTab('daily'); setSelectedPlanDate(today); }}
              className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Calendar size={15} /> Przejdź do planu na dziś
            </button>
          </header>

          {activeTab === 'daily' && <DailyPlanView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'habits' && <HabitsView />}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'settings' && <SettingsView />}
          
        </main>
      </div>

      {/* Modals */}
      <EditTaskModal />
      <EditHabitModal />
      <DeleteConfirmModal />

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-md z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-lg shadow-slate-900/20 flex items-center gap-3 animate-bounce-in pointer-events-auto border border-slate-700">
            <BellRing className="text-indigo-400 shrink-0" size={18} />
            <span className="font-medium text-sm whitespace-normal break-words">{toast.message}</span>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-bounce-in { animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes bounceIn { 0% { opacity: 0; transform: scale(0.9) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      `}} />
    </div>
  );
}
