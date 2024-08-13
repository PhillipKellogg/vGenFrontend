import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Colours, Typography } from "../definitions";
import Button from "../components/Button";
import PageLayout from "../components/PageLayout";
import {
  clearTodoAlerts,
  clearTodoBody,
  updateTodoError,
} from '../actions/todo'
import apiFetch from '../functions/apiFetch'
import { useDispatch, useSelector } from 'react-redux'
import Alert from '../components/Alert'
import { useRouter } from 'next/router' // In package.json, so I wanted to use this, honestly this was a mistake. I should have used react-router-dom. I am not a fan of next/router becuase it lacks caching. Also its slower that pre-loading pages as components.
// I understand that this is because next.js offeres an ability to classify something as server side vs client side, but I don't see the benefit of this in this case.
import dayjs from 'dayjs' // Aready in package.json
import relativeTime from 'dayjs/plugin/relativeTime'

const Todos = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [todos, setTodos] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [allCompleted, setAllCompleted] = useState(false)

  useEffect(() => {
    setAllCompleted(todos.length > 0 && todos.every((todo) => todo.completed))
  }, [todos])

  const todoState = useSelector((state) => state.todo)
  const dispatch = useDispatch()
  const router = useRouter()
  dayjs.extend(relativeTime)

  const handleBack = () => {
    //This function will be called when the back button is clicked.
    router.push('/')
  }

  const handleCreate = () => {
    // Navigate to the create.js page, using this as a function to prevent redirecting during a save.
    router.push('/create') //This was my first time using next router. I am not a fan of this in comparison to react-router-dom. My fault for not looking to deep into it before I used it.
  }

  useEffect(() => {
    dispatch(clearTodoAlerts())
    getTodos()
  }, []) // Load todos on page load

  const getTodos = async () => {
    setIsLoading(true)
    const response = await apiFetch('/todo')

    if (response.status === 200 || response.status === 304) {
      setTodos(sortTodos(response.body))
      dispatch(clearTodoBody())
    } else {
      dispatch(updateTodoError({ error: response.body.error }))
    }

    setIsLoading(false)
  }

  const sortTodos = (todos) => {
    return todos.sort((a, b) => {
      // Primary sort by completed status
      if (a.completed !== b.completed) {
        return a.completed - b.completed
      }
      // Secondary sort by created date
      return dayjs(a.created).isAfter(dayjs(b.created)) ? -1 : 1
    })
  }

  const handleCheckboxChange = (id) => {
    setTodos((todos) =>
      todos.map((todo) =>
        todo.todoID === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
    updateCompletedStatus(id)
  }

  // Sending a patch request here because we are updating the completed status of the todo, not the todo itself.
  const updateCompletedStatus = async (id) => {
    setIsSaving(true)
    // Find the todo by id
    // A cool repository to speed this up is lodash. It has faster native functions than what javascript offers.
    const todo = todos.find((todo) => todo.todoID === id)

    // Only patch if we have a real todo.
    if (todo.userID) {
      // Decided to send individual patch requests becuase it is more seamless to not have the user hitting save after adjusting their to-do list. This is at the expense of more api-requests but the same about of db calls. Bennifitially tho, its only patch requests and doesn't send much data.
      const response = await apiFetch(`/todo/${id}`, {
        // If I had authority to change this, I would enforce strict typing on the id and body.
        method: 'PATCH',
        body: {
          completed: !todo.completed,
        },
      })
      setIsSaving(false)

      if (response.status !== 200) {
        dispatch(updateTodoError({ error: response.body.error }))
        getTodos() // Refresh the todos if the update fails.
      } else {
        dispatch(clearTodoBody())
        setTodos((todos) => todos.sort((a, b) => a.completed - b.completed))
        setTodos((prev) => sortTodos(prev))
      }
    }
  }

  // If I could fully flesh out this project, setting up ESLINT rulling would be a must.
  return (
    <PageLayout title='Create todo'>
      <Container>
        <div className='content'>
          <Button
            size='small'
            text='👈'
            className='backButton'
            variant='neutral-light'
            disabled={isSaving}
            onClick={handleBack}
          />

          {isLoading ? (
            <h1>Loading...</h1>
          ) : (
            <div>
              {todos.length === 0 ? (
                <h1>No Todos Found</h1>
              ) : (
                <div>
                  <div className='title'>
                    <h1>Todo List</h1>
                    {/* Wow look at this guy, adding animations, you should hire him */}
                    {allCompleted && (
                      <div className='thumbs-up-animation'>👍</div>
                    )}
                  </div>

                  <div className='todo-wrapper'>
                    <ul>
                      {todos.map((todo) => (
                        <li
                          if={todo}
                          key={todo.todoID}
                          className='todo-item'
                        >
                          {/* Found this checkbox animation online, swapped the svg for an X*/}
                          <input
                            className='todo-checkbox'
                            id={todo.todoID}
                            type='checkbox'
                            style={{ display: 'none' }}
                            checked={todo.completed}
                            onChange={() => handleCheckboxChange(todo.todoID)}
                          />
                          <label
                            className='todo-label'
                            htmlFor={todo.todoID}
                          >
                            <span>
                              <svg
                                width='12px'
                                height='9px'
                                viewBox='0 0 12 12'
                              >
                                <line
                                  x1='1'
                                  y1='1'
                                  x2='11'
                                  y2='11'
                                  stroke='white'
                                  strokeWidth='2'
                                />
                                <line
                                  x1='1'
                                  y1='11'
                                  x2='11'
                                  y2='1'
                                  stroke='white'
                                  strokeWidth='2'
                                />
                              </svg>
                            </span>
                            <span>
                              {todo.name} -{' '}
                              {dayjs(new Date(todo.created)).fromNow()}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <Alert
                message={todoState.alerts.error}
                onClose={() => dispatch(clearTodoAlerts())}
              />

              <Alert
                message={todoState.alerts.success}
                onClose={() => dispatch(clearTodoAlerts())}
                variant='success'
              />

              <Button
                text={isSaving ? `Saving...` : `Create new todo.`}
                disabled={isSaving}
                size='large'
                variant='primary'
                onClick={handleCreate}
                isFullWidth
                className='createButton'
              />
            </div>
          )}
        </div>
      </Container>
    </PageLayout>
  )
}

export default Todos

const Container = styled.div`
  width: 100%;

  .backButton {
    padding-bottom: 0.5rem;
  }

  .content {
    h1 {
      color: ${Colours.BLACK};
      font-size: ${Typography.HEADING_SIZES.M};
      font-weight: ${Typography.WEIGHTS.LIGHT};
      line-height: 2.625rem;
      margin-bottom: 2rem;
      margin-top: 1rem;
    }

    h2 {
      color: ${Colours.BLACK};
      font-size: ${Typography.HEADING_SIZES.S};
      font-weight: ${Typography.WEIGHTS.LIGHT};
      line-height: 2.625rem;
      margin-bottom: 2rem;
      margin-top: 1rem;
    }

    .createButton {
      margiun-top: 1rem;
    }

    .todo-wrapper {
      display: flex;
      justify-content: center;
    }

    ul {
      list-style-type: none;
      padding: 0;
      margin-right: 20px;
      text-align: justify;
      display: flex-row;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .todo-item {
      margin-bottom: 8px;
    }

    .todo-item .todo-label {
      -webkit-user-select: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
    }

    .todo-item .todo-label span {
      display: inline-block;
      vertical-align: middle;
      transform: translate3d(0, 0, 0);
    }

    .todo-item .todo-label span:first-child {
      position: relative;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      transform: scale(1);
      vertical-align: middle;
      border: 1px solid #b9b8c3;
      transition: all 0.2s ease;
    }

    .todo-item .todo-label span:first-child svg {
      position: absolute;
      z-index: 1;
      top: 8px;
      left: 6px;
      fill: none;
      stroke: white;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 16px;
      stroke-dashoffset: 16px;
      transition: all 0.3s ease;
      transition-delay: 0.1s;
      transform: translate3d(0, 0, 0);
    }

    .todo-item .todo-label span:first-child:before {
      content: '';
      width: 100%;
      height: 100%;
      background: #506eec;
      display: block;
      transform: scale(0);
      opacity: 1;
      border-radius: 50%;
      transition-delay: 0.2s;
    }

    .todo-item .todo-label span:last-child {
      margin-left: 8px;
    }

    .todo-item .todo-label span:last-child:after {
      content: '';
      position: absolute;
      top: 8px;
      left: 0;
      height: 1px;
      width: 100%;
      background: #b9b8c3;
      transform-origin: 0 0;
      transform: scaleX(0);
    }

    .todo-item .todo-label:hover span:first-child {
      border-color: #3c53c7;
    }

    .todo-item .todo-checkbox:checked + .todo-label span:first-child {
      border-color: #3c53c7;
      background: #3c53c7;
      animation: check-15 0.6s ease;
    }

    .todo-item .todo-checkbox:checked + .todo-label span:first-child svg {
      stroke-dashoffset: 0;
    }

    .todo-item .todo-checkbox:checked + .todo-label span:first-child:before {
      transform: scale(2.2);
      opacity: 0;
      transition: all 0.6s ease;
    }

    .todo-item .todo-checkbox:checked + .todo-label span:last-child {
      color: #b9b8c3;
      transition: all 0.3s ease;
    }

    .todo-item .todo-checkbox:checked + .todo-label span:last-child:after {
      transform: scaleX(1);
      transition: all 0.3s ease;
    }

    @keyframes check-15 {
      50% {
        transform: scale(1.2);
      }
    }

    .title {
      position: relative;
    }

    .thumbs-up-animation {
      position: absolute;
      right: 10rem;
      top: 0rem;
      font-size: 2rem;
      animation: thumbsUp 1s ease-in-out;
    }

    @keyframes thumbsUp {
      0% {
        opacity: 0;
        transform: scale(0.2) rotate(0deg);
      }
      90% {
        opacity: 1;
        transform: scale(1.4) rotate(390deg);
      }
      100% {
        opacity: 1;
        transform: scale(1) rotate(360deg);
      }
    }
  }
`





