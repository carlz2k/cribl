import React, { Component } from 'react';
import {
  Route,
  BrowserRouter as Router,
  Routes
} from "react-router-dom";
import { LogStreamingView } from './components/logStreamingView.jsx';

class App extends Component {
  render() {
    return (
      <Router>
        <Routes>
          <Route exact path="/" element={<LogStreamingView />}>
          </Route>
        </Routes>
      </Router>
    );
  }
}

export default App;
