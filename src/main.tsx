import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, redirect } from "react-router-dom";
import App from "./pages/App";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", loader: () => redirect(`/l/${crypto.randomUUID()}`) },
  { path: "/l/:listId", element: <App /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
