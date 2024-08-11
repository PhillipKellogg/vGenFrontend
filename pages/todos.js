import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Colours, Typography } from "../definitions";
import Button from "../components/Button";
import PageLayout from "../components/PageLayout";
// import {
//   clearTodoAlerts,
//   clearTodoBody,
//   updateTodoError,
//   updateTodoName,
//   updateTodoSuccess,
// } from "../actions/todo";
import Form from "../components/Form";
import InputField from "../components/InputField";
import apiFetch from "../functions/apiFetch";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../components/Alert";
import { useRouter } from "next/router"; //We already have next/router imported in the _app.js file, so we can use it here.

const Todos = () => {
  const [isFetching, setIsFetching] = useState(false)
  const [todos, setTodos] = useState([])
  const todoState = useSelector((state) => state.todo)
  const dispatch = useDispatch()

  const router = useRouter()
  const handleBack = () => {
    //This function will be called when the back button is clicked.
    router.back()
  }

  useEffect(() => {
    const getTodos = async () => {
      setIsFetching(true)
      try {
        let response = await apiFetch('/todo')
        console.log('Fetched todos:', response.body) // Log the fetched todos
        setTodos(response.body)
      } catch (error) {
        console.error('Failed to fetch todos:', error)
      }
      setIsFetching(false)
    }

    getTodos()
  }, [])

  // Sorry for the auto formatting...
  return (
    <PageLayout title='Create todo'>
      <Container>
        <div className='content'>
          <Button
            size='small'
            text='<'
            variant='neutral-light'
            onClick={handleBack}
          />
          <h1>Todo List</h1>
          <Alert
            message={todoState.alerts.error}
            onClose={() => dispatch(clearTodoAlerts())}
          />
          <Alert
            message={todoState.alerts.success}
            onClose={() => dispatch(clearTodoAlerts())}
            variant='success'
          />
          {isFetching ? (
            <p>Loading...</p>
          ) : (
            <div>
              <p>LOADED</p>
              {todos.length === 0 && <p>{todos[0]}</p>}
              <ul>
                {todos.map((todo) => (
                  <li key={`${todo.id}asd`}>{todo.title}</li>
                ))}
              </ul>
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

  .content {
    h1 {
      color: ${Colours.BLACK};
      font-size: ${Typography.HEADING_SIZES.M};
      font-weight: ${Typography.WEIGHTS.LIGHT};
      line-height: 2.625rem;
      margin-bottom: 2rem;
      margin-top: 1rem;
    }

    .saveButton {
      margin-top: 1rem;
    }
  }
`;
