import { useEffect, useState } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/todos'

async function request(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || '요청에 실패했습니다')
  return data
}

function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    request(API)
      .then(setTodos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const run = async (fn) => {
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e.message)
    }
  }

  const addTodo = (e) => {
    e.preventDefault()
    const content = input.trim()
    if (!content) return
    run(async () => {
      const todo = await request(API, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      setTodos((prev) => [todo, ...prev])
      setInput('')
    })
  }

  const deleteTodo = (id) =>
    run(async () => {
      await request(`${API}/${id}`, { method: 'DELETE' })
      setTodos((prev) => prev.filter((t) => t._id !== id))
    })

  const startEdit = (todo) => {
    setEditingId(todo._id)
    setEditText(todo.content)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = (id) => {
    const content = editText.trim()
    if (!content) return
    run(async () => {
      const updated = await request(`${API}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })
      setTodos((prev) => prev.map((t) => (t._id === id ? updated : t)))
      setEditingId(null)
    })
  }

  return (
    <main className="app">
      <h1>할일 목록</h1>

      <form className="add-form" onSubmit={addTodo}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="할일을 입력하세요"
        />
        <button type="submit">추가</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="empty">불러오는 중...</p>
      ) : todos.length === 0 ? (
        <p className="empty">할일이 없습니다</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo._id}>
              {editingId === todo._id ? (
                <>
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(todo._id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                  />
                  <button onClick={() => saveEdit(todo._id)}>저장</button>
                  <button className="secondary" onClick={cancelEdit}>
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span>{todo.content}</span>
                  <button className="secondary" onClick={() => startEdit(todo)}>
                    수정
                  </button>
                  <button className="danger" onClick={() => deleteTodo(todo._id)}>
                    삭제
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
