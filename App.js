import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { CheckBox, Input, Button, ThemeProvider } from '@rneui/themed';

// ── Color palette ──────────────────────────────────────────────
const COLORS = {
  primary: '#B2BDDE',
  primaryDark: '#8A9AC8',
  primaryLight: '#D5DCF0',
  accent: '#7B4242',
  accentLight: '#A85C5C',
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray100: '#F5F5F5',
  gray200: '#E8E8E8',
  gray300: '#D0D0D0',
  gray400: '#A0A0A0',
  gray500: '#707070',
  gray600: '#505050',
};

// ── RNE Theme ──────────────────────────────────────────────────
const rneTheme = {
  CheckBox: {
    checkedColor: COLORS.accent,
    uncheckedColor: COLORS.primary,
    size: 24,
  },
  Input: {
    inputStyle: { color: COLORS.black, fontSize: 15 },
    placeholderTextColor: COLORS.gray400,
    inputContainerStyle: {
      borderBottomColor: COLORS.primary,
      borderBottomWidth: 1.5,
    },
  },
  Button: {
    buttonStyle: { backgroundColor: COLORS.accent, borderRadius: 10 },
    titleStyle: { fontWeight: '700', fontSize: 15 },
  },
};

// ── Helpers ────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ── Default events (state) ────────────────────────────────────
const today = new Date();
const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

const DEFAULT_EVENTS = {
  [todayKey]: [
    { key: '1', description: 'Team standup meeting', completed: false },
    { key: '2', description: 'Review project proposal', completed: true },
    { key: '3', description: 'Lunch with design team', completed: false },
  ],
};

// ── App ────────────────────────────────────────────────────────
export default function App() {
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [inputText, setInputText] = useState('');
  const [editModal, setEditModal] = useState({ visible: false, item: null });
  const [editText, setEditText] = useState('');

  const currentTasks = events[selectedDate] || [];

  // ── Add task ──────────────────────────────────────────────────
  function addTask() {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const newKey = Date.now().toString();
    setEvents({
      ...events,
      [selectedDate]: [...currentTasks, { key: newKey, description: trimmed, completed: false }],
    });
    setInputText('');
  }

  // ── Toggle complete ───────────────────────────────────────────
  function toggleComplete(key) {
    const updated = currentTasks.map((t) =>
      t.key === key ? { ...t, completed: !t.completed } : t
    );
    setEvents({ ...events, [selectedDate]: updated });
  }

  // ── Delete task ───────────────────────────────────────────────
  function deleteTask(key) {
    const updated = currentTasks.filter((t) => t.key !== key);
    const newEvents = { ...events };
    if (updated.length === 0) delete newEvents[selectedDate];
    else newEvents[selectedDate] = updated;
    setEvents(newEvents);
  }

  // ── Edit modal ────────────────────────────────────────────────
  function openEdit(item) {
    setEditText(item.description);
    setEditModal({ visible: true, item });
  }

  function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    const updated = currentTasks.map((t) =>
      t.key === editModal.item.key ? { ...t, description: trimmed } : t
    );
    setEvents({ ...events, [selectedDate]: updated });
    setEditModal({ visible: false, item: null });
  }

  // ── Month navigation ──────────────────────────────────────────
  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  }

  // ── Calendar grid ─────────────────────────────────────────────
  function renderCalendar() {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentYear, currentMonth, day);
      const isSelected = dateKey === selectedDate;
      const isToday = dateKey === todayKey;
      const hasEvents = events[dateKey] && events[dateKey].length > 0;

      cells.push(
        <TouchableOpacity
          key={dateKey}
          style={[
            styles.calendarCell,
            isSelected && styles.calendarCellSelected,
            isToday && !isSelected && styles.calendarCellToday,
          ]}
          onPress={() => setSelectedDate(dateKey)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              isToday && !isSelected && styles.calendarDayTextToday,
            ]}
          >
            {day}
          </Text>
          {hasEvents && (
            <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />
          )}
        </TouchableOpacity>
      );
    }

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(
        <View key={`row-${i}`} style={styles.calendarRow}>
          {cells.slice(i, i + 7)}
        </View>
      );
    }
    return rows;
  }

  function formatSelectedLabel() {
    const [y, m, d] = selectedDate.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return `${DAYS_OF_WEEK[date.getDay()]}, ${MONTH_NAMES[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  }

  // ── Web-safe CheckBox wrapper ─────────────────────────────────
  function TaskCheckBox({ checked, onPress }) {
    if (Platform.OS === 'web') {
      return (
        <TouchableOpacity
          style={[styles.webCheckbox, checked && styles.webCheckboxChecked]}
          onPress={onPress}
        >
          {checked && <Text style={styles.webCheckmark}>✓</Text>}
        </TouchableOpacity>
      );
    }
    return (
      <CheckBox
        checked={checked}
        onPress={onPress}
        checkedColor={COLORS.accent}
        uncheckedColor={COLORS.primaryDark}
        containerStyle={styles.checkboxContainer}
        size={22}
      />
    );
  }

  // ── Render task item ──────────────────────────────────────────
  function renderItem({ item }) {
    return (
      <View style={styles.taskItem}>
        <TaskCheckBox
          checked={item.completed}
          onPress={() => toggleComplete(item.key)}
        />

        <Text
          style={[
            styles.taskText,
            item.completed && {
              textDecorationLine: 'line-through',
              textDecorationStyle: 'solid',
              color: COLORS.gray400,
            },
          ]}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        <View style={styles.taskActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => deleteTask(item.key)}
          >
            <Text style={[styles.actionBtnText, styles.deleteBtnText]}>Del</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={{ lightColors: rneTheme }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendly</Text>
          <Text style={styles.headerSubtitle}>Your personal planner</Text>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.monthNavBtn} onPress={prevMonth}>
              <Text style={styles.monthNavBtnText}>{'‹'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity style={styles.monthNavBtn} onPress={nextMonth}>
              <Text style={styles.monthNavBtnText}>{'›'}</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarContainer}>
            <View style={styles.calendarRow}>
              {DAYS_OF_WEEK.map((d) => (
                <View key={d} style={styles.calendarCell}>
                  <Text style={styles.calendarHeaderText}>{d}</Text>
                </View>
              ))}
            </View>
            {renderCalendar()}
          </View>

          {/* Selected date label */}
          <View style={styles.dateLabelRow}>
            <Text style={styles.dateLabel}>{formatSelectedLabel()}</Text>
            <Text style={styles.taskCount}>
              {currentTasks.length} {currentTasks.length === 1 ? 'event' : 'events'}
            </Text>
          </View>

          {/* Task list (FlatList) */}
          <FlatList
            data={currentTasks}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No events for this day.</Text>
                <Text style={styles.emptySubText}>Add one below!</Text>
              </View>
            }
          />

          {/* Add task — RNE Input + RNE Button */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputRow}>
              {/* RNE Input */}
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="New event..."
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={addTask}
                  returnKeyType="done"
                  containerStyle={{ paddingHorizontal: 0 }}
                  inputContainerStyle={{
                    borderWidth: 1.5,
                    borderColor: COLORS.primary,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    backgroundColor: COLORS.white,
                  }}
                  inputStyle={{ color: COLORS.black, fontSize: 15 }}
                  placeholderTextColor={COLORS.gray400}
                />
              </View>

              {/* RNE Button */}
              <Button
                title="Add"
                onPress={addTask}
                buttonStyle={styles.addBtn}
                titleStyle={styles.addBtnText}
                containerStyle={styles.addBtnContainer}
              />
            </View>
          </KeyboardAvoidingView>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Edit Modal */}
        <Modal
          visible={editModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModal({ visible: false, item: null })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Event</Text>

              {/* RNE Input in modal */}
              <Input
                value={editText}
                onChangeText={setEditText}
                autoFocus
                multiline
                inputContainerStyle={{
                  borderWidth: 1.5,
                  borderColor: COLORS.primary,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  backgroundColor: COLORS.white,
                  minHeight: 60,
                }}
                inputStyle={{ color: COLORS.black, fontSize: 15 }}
                containerStyle={{ paddingHorizontal: 0 }}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => setEditModal({ visible: false, item: null })}
                  buttonStyle={styles.modalCancelBtn}
                  titleStyle={styles.modalCancelText}
                  containerStyle={{ marginRight: 8 }}
                />
                <Button
                  title="Save"
                  onPress={saveEdit}
                  buttonStyle={styles.modalSaveBtn}
                  titleStyle={styles.modalSaveText}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ThemeProvider>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray100 },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.black, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: COLORS.gray600, marginTop: 2 },

  scrollArea: { flex: 1 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  monthNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  monthNavBtnText: { fontSize: 22, color: COLORS.gray600, lineHeight: 26 },
  monthTitle: { fontSize: 17, fontWeight: '600', color: COLORS.black },

  calendarContainer: {
    backgroundColor: COLORS.white, paddingHorizontal: 8, paddingBottom: 8,
  },
  calendarRow: { flexDirection: 'row' },
  calendarCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, minHeight: 44,
  },
  calendarHeaderText: {
    fontSize: 11, fontWeight: '600', color: COLORS.gray400, textTransform: 'uppercase',
  },
  calendarDayText: { fontSize: 14, color: COLORS.black },
  calendarCellSelected: { backgroundColor: COLORS.accent, borderRadius: 22 },
  calendarCellToday: { backgroundColor: COLORS.primaryLight, borderRadius: 22 },
  calendarDayTextSelected: { color: COLORS.white, fontWeight: '700' },
  calendarDayTextToday: { color: COLORS.accent, fontWeight: '700' },
  eventDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: COLORS.accent, marginTop: 2,
  },
  eventDotSelected: { backgroundColor: COLORS.white },

  dateLabelRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  dateLabel: { fontSize: 14, fontWeight: '600', color: COLORS.gray600 },
  taskCount: { fontSize: 12, color: COLORS.gray400 },

  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 4,
    paddingRight: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  checkboxContainer: {
    margin: 0,
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  webCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: 6,
  },
  webCheckboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  webCheckmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  taskText: { flex: 1, fontSize: 15, color: COLORS.black },
  taskActions: { flexDirection: 'row', marginLeft: 8 },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: COLORS.primaryLight, marginLeft: 6,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.gray600 },
  deleteBtn: { backgroundColor: '#F5E8E8' },
  deleteBtnText: { color: COLORS.accent },

  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 15, color: COLORS.gray400 },
  emptySubText: { fontSize: 13, color: COLORS.gray300, marginTop: 4 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 4,
  },
  inputWrapper: { flex: 1 },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  addBtnContainer: { marginLeft: 8, marginBottom: 18 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 24, width: '85%',
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  modalCancelBtn: { backgroundColor: COLORS.gray300, borderRadius: 10, paddingHorizontal: 14 },
  modalCancelText: { color: COLORS.gray600, fontWeight: '600', fontSize: 14 },
  modalSaveBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 14 },
  modalSaveText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
