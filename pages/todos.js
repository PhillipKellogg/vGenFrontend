import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Colours, Typography } from "../definitions";
import Button from "../components/Button";
import PageLayout from "../components/PageLayout";
import {
  clearTodoAlerts,
  clearTodoBody,
  updateTodoError,
  updateTodoName,
  updateTodoSuccess,
} from "../actions/todo";
import Form from "../components/Form";
import InputField from "../components/InputField";
import apiFetch from "../functions/apiFetch";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../components/Alert";
import { useRouter } from "next/router"; //We already have next/router imported in the _app.js file, so we can use it here.

const Create = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [todos, setTodos] = useState([]);
  const todoState = useSelector((state) => state.todo);
  const dispatch = useDispatch();

  const router = useRouter();
  const handleBack = () => {
    //This function will be called when the back button is clicked.
    router.back();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (todoState.body.name) {
      setIsFetching(true);
      dispatch(clearTodoAlerts());
      let response = await apiFetch("/todo", {
        method: "get",
      });
      setIsFetching(false);
      if (response.status === 201) {
        dispatch(
          updateTodoSuccess({
            success: `Todo "${todoState.body.name}" saved successfully`,
          })
        );
        dispatch(clearTodoBody());
      } else {
        dispatch(updateTodoError({ error: response.body.error }));
      }
    }
  };

  useEffect(() => {
    console.log("ComponentDidMount");
    getTodos();
  }, []); // Run only on mount.

  // Get request for todos.
  const getTodos = async () => {
    setIsFetching(true);
    try {
      let response = await apiFetch("/todo");
      setTodos(response.body);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
    setIsFetching(false);

    console.log(todos[0]);
  };

  // Sorry for the auto formatting...
  return (
    <PageLayout title="Create todo">
      <Container>
        <div className="content">
          <Button
            size="small"
            text="<"
            variant="neutral-light"
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
            variant="success"
          />
          <Form onSubmit={handleSubmit}>
            <InputField
              className="input"
              type="text"
              placeholder="Todo item name"
              required
              value={todoState.body.name}
              onChange={(e) =>
                dispatch(updateTodoName({ name: e.target.value }))
              }
            />
            <Button
              className="saveButton"
              type="submit"
              text="Save"
              size="large"
              variant="primary"
              disabled={isFetching || !todoState.body.name}
              isFullWidth
            />
          </Form>
        </div>
      </Container>
    </PageLayout>
  );
};

export default Create;

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
