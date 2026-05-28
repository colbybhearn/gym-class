<script>
import { updatePerson, setPerson, getPeopleForDay } from '../firebase';
import { dateToDisplay, dateToId } from '../utils';


const exercises = [
  { id:'dailyQuietTime',  label: 'Quiet time daily',       type: 'check' },
  { id:'dailyStretch',    label: 'Stretch daily',          type: 'check' },
  { id:'dailySteps',      label: '5000 steps daily',       type: 'number',  placeholder: 'steps' },
  { id:'dailyHydration',  label: '3L of water daily',      type: 'text',    placeholder: 'e.g. 2.5L' },
  { id:'dailyWorkout',    label: '30 min workout, 4x/week',type: 'text',    placeholder: 'workout type' },
  { id:'dailyWalking',    label: '15 min walk, 3x/week',   type: 'check' },
  { id:'dailyMeals',      label: 'Eat whole meals',        type: 'longtext',placeholder: 'what you ate' },
]

export default {
  data() {
    const people = ['Lara', 'Stephen', 'Chelsey', 'Colby']
    return {
      date: new Date(),
      currentPerson: localStorage.getItem('currentPerson') ?? people[0],
      exercises,
      people,
      loading: false,
      focusedCell: null,
      debounceTimer: null,
      isDirty: false,
      checks: Object.fromEntries(
        people.map(p => [
          p,
          Object.fromEntries(exercises.map(e => [e.id, e.type === 'check' ? false : ''])),
        ])
      ),
    }
  },
  computed: {
    currentDateDisplay() {
      return dateToDisplay(this.date)
    },
    currentDateId(){
      return dateToId(this.date)
    },
    visiblePeople() {
      return this.currentPerson === 'ALL' ? this.people : [this.currentPerson]
    },
  },
  methods: {
    // Track which cell is active so we can flush it on navigation
    onFocus(person, exercise) {
      this.focusedCell = { person, exercise }
    },
    onBlur() {
      this.focusedCell = null
    },

    // Debounced save triggered by @input
    onInput(person, exercise) {
      this.isDirty = true
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.updateActivity(person, exercise)
      }, 1000)
    },

    // Flush any pending debounce and save the focused cell immediately
    async flushPending() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
      if (this.focusedCell && this.isDirty) {
        await this.updateActivity(this.focusedCell.person, this.focusedCell.exercise)
      }
    },

    selectPerson(name) {
      this.flushPending()
      this.currentPerson = name
      localStorage.setItem('currentPerson', name)
    },
    addPerson() {
      const name = prompt('Enter name:')
      if (!name || !name.trim()) return
      const trimmed = name.trim()
      if (this.people.includes(trimmed)) return
      this.people.push(trimmed)
      this.checks[trimmed] = Object.fromEntries(exercises.map(e => [e.id, e.type === 'check' ? false : '']))
    },
    async dateNext(){
      await this.flushPending()
      const d = new Date(this.date)
      d.setDate(d.getDate() + 1)
      this.date = d
      this.loadDay()
    },
    async datePrev(){
      await this.flushPending()
      const d = new Date(this.date)
      d.setDate(d.getDate() - 1)
      this.date = d
      this.loadDay()
    },

    async loadDay() {
      this.loading = true
      try {
        const data = await getPeopleForDay(this.currentDateId)
        for (const person of this.people) {
          const defaults = Object.fromEntries(exercises.map(e => [e.id, e.type === 'check' ? false : '']))
          this.checks[person] = { ...defaults, ...(data[person] ?? {}) }
        }
      } finally {
        this.loading = false
      }
    },

    async updateActivity(person, exercise) {
      const data = { [exercise.id]: this.checks[person][exercise.id] }
      try {
        await updatePerson(this.currentDateId, person, data)
        this.isDirty = false
      } catch (e) {
        if (e.code === 'not-found') {
          try {
            await setPerson(this.currentDateId, person, this.checks[person])
            this.isDirty = false
          } catch (e2) {
            console.error(e2)
          }
        } else {
          console.error(e)
        }
      }
    }
  },
  created() {
    this.loadDay()
  }
}
</script>

<template>
  <div class="tracker">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    <div class="date-nav">
      <button class="nav-btn" @click="datePrev">&#8592; Prev</button>
      <select id="person-picker" :value="currentPerson" @change="selectPerson($event.target.value)">
        <option value="ALL">All</option>
        <option v-for="person in people" :key="person" :value="person">{{ person }}</option>
      </select>
      <button class="nav-btn" @click="dateNext">Next &#8594;</button>
    </div>
    <div class="date-row">{{ currentDateDisplay }}</div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="exercise-col date-cell">Activity</th>
            <th v-for="person in visiblePeople" :key="person">{{ person }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exercise in exercises" :key="exercise.label">
            <td class="exercise-label">{{ exercise.label }}</td>
            <td v-for="person in visiblePeople" :key="person" class="check-cell">
              <input
                v-if="exercise.type === 'check'"
                type="checkbox"
                v-model="checks[person][exercise.id]"
                @change="updateActivity(person, exercise)"
              />
              <textarea
                v-else-if="exercise.type === 'longtext'"
                v-model="checks[person][exercise.id]"
                style="min-height: 100px;"
                @focus="onFocus(person, exercise)"
                @blur="onBlur"
                @input="onInput(person, exercise)"
                @change="updateActivity(person, exercise)"
              ></textarea>
              <input
                v-else
                :type="exercise.type"
                v-model="checks[person][exercise.id]"
                :placeholder="exercise.placeholder"
                class="text-input"
                @focus="onFocus(person, exercise)"
                @blur="onBlur"
                @input="onInput(person, exercise)"
                @change="updateActivity(person, exercise)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>    
  </div>
</template>

<style scoped>
.tracker {
  position: relative;
  padding: 2px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.table-wrap {
  overflow-x: auto;
  width: 100%;
}

table {
  border-collapse: collapse;
  min-width: 100%;
}

th,
td {
  border: 1px solid var(--border);
  padding: 3px 6px;
  text-align: center;
  white-space: nowrap;
}

th {
  background: var(--code-bg);
  color: var(--text-h);
  font-weight: 600;
  font-size: 15px;
}

.exercise-col {
  width: 1%;
  white-space: nowrap;
}

.date-cell {
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.exercise-label {
  text-align: left;
  color: var(--text-h);
  font-size: 15px;
}

.text-input {
  width: 110px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-h);
  font-size: 13px;
  font-family: var(--sans);
  text-align: center;
}

.text-input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.check-cell input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
}

tr:hover td {
  background: var(--accent-bg);
}

.add-btn {
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--accent-border);
  background: var(--accent-bg);
  color: var(--accent);
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.add-btn:hover {
  box-shadow: var(--shadow);
}

.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}


.date-row {
  width: 100%;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-h);
}

.nav-btn {
  flex: 0 0 auto;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--accent-border);
  background: var(--accent-bg);
  color: var(--accent);
  cursor: pointer;
  touch-action: manipulation;
}

.nav-btn:hover {
  box-shadow: var(--shadow);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.date-nav select {
  flex: 1;
  margin: 0 12px;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--accent-border);
  background: var(--accent-bg);
  color: var(--accent);
  cursor: pointer;
  font-family: var(--sans);
}
</style>
