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
            
      exercises,
      people,
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
    }
  },
  methods: {    
    addPerson() {
      const name = prompt('Enter name:')
      if (!name || !name.trim()) return
      const trimmed = name.trim()
      if (this.people.includes(trimmed)) return
      this.people.push(trimmed)
      this.checks[trimmed] = Object.fromEntries(exercises.map(e => [e.id, e.type === 'check' ? false : '']))
    },
    dateNext(){
      const d = new Date(this.date)
      d.setDate(d.getDate() + 1)
      this.date = d
      this.loadDay()
    },
    datePrev(){
      const d = new Date(this.date)
      d.setDate(d.getDate() - 1)
      this.date = d
      this.loadDay()
    },

    async loadDay() {
      const data = await getPeopleForDay(this.currentDateId)
      for (const person of this.people) {
        if (data[person]) {
          this.checks[person] = { ...this.checks[person], ...data[person] }
        }
      }
    },

    async updateActivity(person, exercise) {
      const data = { [exercise.id]: this.checks[person][exercise.id] }
      try {
        await updatePerson(this.currentDateId, person, data)
      } catch (e) {
        if (e.code === 'not-found') {
          console.log(this.checks[person])
          await setPerson(this.currentDateId, person, this.checks[person])
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
    <div class="date-nav">
      <button class="nav-btn" @click="datePrev">&#8592; Prev</button>
      <span class="date-label">{{ currentDateDisplay }}</span>
      <button class="nav-btn" @click="dateNext">Next &#8594;</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="exercise-col date-cell">{{ currentDateDisplay }}</th>
            <th v-for="person in people" :key="person">{{ person }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exercise in exercises" :key="exercise.label">
            <td class="exercise-label">{{ exercise.label }}</td>
            <td v-for="person in people" :key="person" class="check-cell">
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
                @change="updateActivity(person, exercise)"
              ></textarea>
              <input
                v-else
                :type="exercise.type"
                v-model="checks[person][exercise.id]"
                :placeholder="exercise.placeholder"
                class="text-input"
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
  min-width: 220px;
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
  gap: 12px;
  width: 100%;
}

.date-label {
  flex: 1;
  text-align: center;
  font-size: 16px;
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
</style>
