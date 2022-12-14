import "./App.css";
import { Button, Row, Col, Form, Input, Radio } from "antd";

import React, { useState, useEffect } from "react";
import socketIO from "socket.io-client";

//const serverHost ="estroom9.alwaysdata.net";
const serverHost = "http://localhost:8100";
const socket = socketIO(serverHost);

const ClientListener = {
  MESSAGE: "message",
  ALL_ROOM: "allRoom",
};

const ServerListener = {
  MESSAGE: "message",
  MESSAGE_ALL: "messageAll",
  JOIN: "join",
  ADD_ROOM: "addRoom",
  ALL_ROOM: "allRoom",
  REMOVE_ALL_ROOM: "removeAllRoom",
  VOTE: "vote",
  GAME_EVENT: "GAME_EVENT",
};

const UserType = {
  USER: "User",
  HOST: "Host",
};

const points = [4, 6, 8, 12, 16, 20, 24, 32, 40];

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [roomName, setRoomName] = useState("");
  const [allRooms, setAllRooms] = useState([]);
  const [isJoinRoom, setIsJoinRoom] = useState(false);
  const [userName, setUserName] = useState("");
  const [isLocked, setIsLocked] = useState(false); // server locked
  const [currentPoint, setCurrentPoint] = useState(""); // current point picked
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    //#region  default
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setIsJoinRoom(false);
      setAllRooms([]);
      setUserName("");
    });
    //#endregion

    //#region client listen
    socket.on(ClientListener.MESSAGE, (data) => {
      const { type, message } = data;
      switch (type) {
        case "roomJoined":
          setIsJoinRoom(true);
          setCurrentUser(message);
          break;
        case "users":
          setUsers(message);

          console.log("message ", message);
          break;
        default:
          console.log("room server >>  ", data);
          break;
      }
    });

    socket.on(ClientListener.ALL_ROOM, (data) => {
      console.log("server >> ", data);
      setAllRooms(data);
    });

    //#endregion

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(ClientListener.MESSAGE);
      socket.off(ClientListener.ALL_ROOM);
    };
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      userType: UserType.USER,
    });
  }, [isJoinRoom]);

  //#region Private method
  const disconnect = () => {
    socket.disconnect();
  };

  const connect = () => {
    socket.connect();
  };

  const sendToServer = (method, data) => {
    socket.emit(method, data);
  };
  //#endregion

  const initRoomDefault = (userName, userType) => {
    const roomDefault = "ScrumCard";
    sendToServer(ServerListener.ADD_ROOM, { name: roomDefault });
    sendToServer(ServerListener.JOIN, {
      name: userName,
      userType: userType,
      room: roomDefault,
    });
  };

  const onJoinRoom = (formValue) => {
    const { userName, userType } = formValue;
    const normalText = userName.trim();
    setUserName(normalText);
    initRoomDefault(normalText, userType);
  };

  const sendVote = (point) => {
    sendToServer(ServerListener.VOTE, point);
    console.log("sed");
  };

  const BoardCard = () => {
    return (
      <div>
        <h2 className="text-center">{userName}</h2>
        <Row className="board-card">
          {points.map((p, index) => {
            return (
              <Col
                className={`card-wrapper ${
                  currentPoint === p ? "card-wrapper-selected" : ""
                }`}
                key={index}
              >
                <CustomCard point={p} />
              </Col>
            );
          })}
        </Row>
        <br />
        <Row>
          <Col span={24} className="d-flex mb-2">
            <Button
              type="primary"
              className="m-auto btn-action"
              htmlType="button"
              disabled={isLocked || currentPoint === ""}
              onClick={() => sendVote(currentPoint)}
            >
              Send Vote
            </Button>
          </Col>
          <Col span={24} className="d-flex mb-2">
            <Button
              className="m-auto btn-action"
              htmlType="button"
              disabled={isLocked}
              onClick={() => setCurrentPoint("")}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </div>
    );
  };

  const options = [
    { label: UserType.USER, value: UserType.USER },
    { label: UserType.HOST, value: UserType.HOST },
  ];

  const Login = () => {
    return (
      <Form onFinish={onJoinRoom} className="center" form={form}>
        <Row>
          <Col className="m-auto">
            <p className="text-center">Nickname</p>
            <Form.Item
              name="userName"
              rules={[
                { required: true, message: "Please input your nickname!" },
              ]}
            >
              <Input
                className="text-center"
                placeholder="Enter your nickname"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row className="d-flex mb-2">
          <Form.Item
            className="m-auto"
            name="userType"
            valuePropName="checked"
            hidden
          >
            <Input />
          </Form.Item>
          <Col className="m-auto">
            <Radio.Group
              onChange={(e) => {
                const value = e.target.value;
                form.setFieldsValue({
                  ...form.getFieldsValue(),
                  userType: value,
                });
              }}
              defaultValue={"User"}
              options={options}
              optionType="button"
              buttonStyle="solid"
            />
          </Col>
        </Row>
        <Row>
          <Col className="m-auto">
            <Button htmlType="submit">Join</Button>
          </Col>
        </Row>
      </Form>
    );
  };

  const CustomCard = (props) => {
    const { point } = props;
    return (
      <div
        className="card"
        onClick={() => {
          if (isLocked === false) {
            setCurrentPoint(point);
          }
        }}
      >
        <div className="card-border">
          <h1 className="card-point">{point}</h1>
        </div>
      </div>
    );
  };

  const getResult = (result) => {
    if (showResult === true) {
      return result.voted;
    }

    return "Voted";
  };

  const Board = () => {
    const allUsers = users?.filter((u) => u.userType === UserType.USER);
    const totalVoted = allUsers.filter((u) => u.voted > 0)?.length;
    return (
      <div>
        <Row>
          <Col>
            <Button
              type="link"
              onClick={() => {
                sendToServer(ServerListener.GAME_EVENT, {
                  type: "NEW_GAME",
                });
                setShowResult(false);
              }}
            >
              New
            </Button>
          </Col>
        </Row>
        <Row>
          <Col>
            <Button type="link" className="m-auto">
              Total: {totalVoted}/{allUsers?.length}
            </Button>
          </Col>
          <Col>
            <Button type="link" onClick={() => setShowResult(true)}>
              Click to show
            </Button>
          </Col>
        </Row>

        <Row className="member-board">
          <Col span={24}>
            <h5>Members</h5>
            <Row gutter={[24, 24]}>
              {allUsers?.map((u, index) => {
                return (
                  <Col key={index} span={8}>
                    <span className="member-name">{u.name}</span>
                    <span className="member-point">
                      {u.voted > 0 && getResult(u)}
                    </span>
                  </Col>
                );
              })}
            </Row>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className="full-screen main-bg">
      {!isJoinRoom && (
        <div className="full-screen d-flex">
          <Login />
        </div>
      )}
      {isJoinRoom && currentUser?.userType === UserType.USER ? (
        <BoardCard />
      ) : (
        <Board />
      )}
    </div>
  );
}

export default App;
