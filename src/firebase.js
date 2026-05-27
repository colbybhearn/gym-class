import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyC0vyoNmLM2FKSGv4utSL6dGR8cqRY-n38',
  authDomain: 'gym-class-b7baa.firebaseapp.com',
  projectId: 'gym-class-b7baa',
  storageBucket: 'gym-class-b7baa.firebasestorage.app',
  messagingSenderId: '694888817417',
  appId: '1:694888817417:web:6eb4cac9fe68073ab529d8',
  measurementId: 'G-7DKS8RPXEE',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Reference helpers
function dayRef(dateId) {
  return doc(db, 'day', dateId)
}

function personRef(dateId, personName) {
  return doc(db, 'day', dateId, 'person', personName)
}

function personCollectionRef(dateId) {
  return collection(db, 'day', dateId, 'person')
}

// Get all person records for a given day
export async function getPeopleForDay(dateId) {
  const snap = await getDocs(personCollectionRef(dateId))
  return Object.fromEntries(snap.docs.map(d => [d.id, d.data()]))
}

// Get a single person's record for a day
export async function getPerson(dateId, personName) {
  const snap = await getDoc(personRef(dateId, personName))
  return snap.exists() ? snap.data() : null
}

// Create or overwrite a person record for a day
export async function setPerson(dateId, personName, data) {
  await setDoc(personRef(dateId, personName), data)
}

// Partially update a person record (only provided fields)
export async function updatePerson(dateId, personName, data) {
  await updateDoc(personRef(dateId, personName), data)
}

// Delete a person record for a day
export async function deletePerson(dateId, personName) {
  await deleteDoc(personRef(dateId, personName))
}
