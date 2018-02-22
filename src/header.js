import React, { Component } from 'react';
import {Jumbotron} from 'reactstrap';
import './header.css';

export default class Header extends Component {
  render() {
    return (
        <Jumbotron className="header"> 
            <div className="title">Tilt.gg</div>
        </Jumbotron>
    );
  }
}