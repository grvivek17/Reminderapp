import React, { useContext, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TasksContext } from '../context/TasksContext';

export default function CalendarView() {
  const { tasks, currentDate, setCurrentDate } = useContext(TasksContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    setCurrentMonth(new Date(currentDate));
  }, [currentDate]);

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Generate calendar days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null); // Empty slots
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={prevMonth} className="icon-btn" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <ChevronLeft size={20} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
          {monthNames[month]} {year}
        </h2>
        <button onClick={nextMonth} className="icon-btn" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '12px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{day}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} style={{ minHeight: '60px' }} />;
          
          const dateStr = date.toISOString().slice(0, 10);
          const dayTasks = tasks.filter(t => t.date === dateStr);
          const isSelected = dateStr === currentDate;
          const isToday = dateStr === new Date().toISOString().slice(0, 10);

          return (
            <div 
              key={dateStr}
              onClick={() => setCurrentDate(dateStr)}
              style={{
                minHeight: '60px',
                padding: '8px 4px',
                borderRadius: '8px',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: isSelected ? 'var(--accent-light)' : 'var(--surface)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                width: '28px', height: '28px', 
                borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isToday ? 'var(--accent)' : 'transparent',
                color: isToday ? 'white' : 'var(--text)',
                fontWeight: isToday ? 'bold' : 'normal',
                fontSize: '0.9rem'
              }}>
                {date.getDate()}
              </div>
              
              <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                {dayTasks.slice(0, 3).map((t, i) => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
                ))}
                {dayTasks.length > 3 && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>+</div>}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
          Tasks for {new Date(currentDate).toLocaleDateString()}
        </h3>
        {tasks.filter(t => t.date === currentDate).length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No tasks for this date.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.filter(t => t.date === currentDate).map(task => (
              <li key={task.id} style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ fontWeight: 500 }}>{task.text}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.category}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
