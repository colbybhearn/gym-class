<script setup>
import { ref, computed } from 'vue'

const today = computed(() =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
)

const exercises = [
  { label: 'Quiet time daily',       type: 'check' },
  { label: 'Stretch daily',          type: 'check' },
  { label: '5000 steps daily',       type: 'number', placeholder: 'steps' },
  { label: '3L of water daily',      type: 'text',   placeholder: 'e.g. 2.5L' },
  { label: '30 min workout, 4x/week',type: 'text',   placeholder: 'workout type' },
  { label: '15 min walk, 3x/week',   type: 'check' },
  { label: 'Eat whole meals',        type: 'text',   placeholder: 'what you ate' },
]

const people = ref(['Lara', 'Stephen', 'Chelsey', 'Colby'])

const checks = ref(
  Object.fromEntries(
    people.value.map(p => [
      p,
      Object.fromEntries(exercises.map(e => [e.label, e.type === 'check' ? false : ''])),
    ])
  )
)

function addPerson() {
  const name = prompt('Enter name:')
  if (!name || !name.trim()) return
  const trimmed = name.trim()
  if (people.value.includes(trimmed)) return
  people.value.push(trimmed)
  checks.value[trimmed] = Object.fromEntries(exercises.map(e => [e.label, e.type === 'check' ? false : '']))
}
</script>

<template>
  <div class="tracker">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th class="exercise-col date-cell">{{ today }}</th>
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
                v-model="checks[person][exercise.label]"
              />
              <input
                v-else
                :type="exercise.type"
                v-model="checks[person][exercise.label]"
                :placeholder="exercise.placeholder"
                class="text-input"
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
</style>
