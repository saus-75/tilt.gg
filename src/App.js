import React, { Component } from 'react';
import Header from './header';
import {KEY} from './key';
import {region} from './const'
import './App.css';
import axios from 'axios';
import ContentLoader from 'react-content-loader';
import {
  InputGroup,
  InputGroupAddon,
  Input,
  Button,
 } from 'reactstrap';

var championData = require('./champions');

class App extends Component {
  render() {
    return (
        <div>
          <Header />
          <Form />
        </div>
    );
  }
}

class Form extends Component {
  constructor(){
    super();
    this.state = {
      region: 'Oceania',
      summonerName: '',
      accInfo: {},
      matches: [],
      matchData:{},
      vers: '8.4.1',
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event){
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const name = this.state.summonerName;
    const server = this.state.region;
    //Validation check
    if (name === null || name === ''){
      alert(`Name field is empty!`);
    } else {
      //Finds summoner id & acc id by name
      this.setState({loading: true});
      axios.get(`https://${region[server]}.api.riotgames.com/lol/summoner/v3/summoners/by-name/${name}?api_key=${KEY}`, {})
      .then(
        (response) => {
          this.setState({
            summonerName: response.data.name,
            accInfo: response.data
          });
          const acc = this.state.accInfo;
          //returns last 20 match
          return axios.get(`https://${region[server]}.api.riotgames.com/lol/match/v3/matchlists/by-account/${acc['accountId']}/recent?api_key=${KEY}`, {});
        }
      ).then(
        (response) => {
          this.setState({
            matches: response.data.matches,
          });
          var promises = [];
          this.state.matches.forEach((val) => {
            //goes another layer in by retrieving detail of each match
            let url = `https://${region[server]}.api.riotgames.com/lol/match/v3/matches/${val.gameId}?api_key=${KEY}`;
            promises.push(axios.get(url));
          });
          return axios.all(promises, {});
        }
      ).then(
        (response) => {
          this.setState({
            matchData: response,
          });
          this.setState({loading: false});
        }
      ).catch(error => {alert(error);});
    }
  }

  render() {
    return (
      <div className="body">

        <div className="form">
          <form onSubmit={this.handleSubmit}>
            <InputGroup>
              <InputGroupAddon addonType="prepend">
                <select value={this.state.region} name="region" onChange={(event) => this.handleChange(event)}>
                    {Object.keys(region).map((server)=>
                      <option key={server} value={server}>{server}</option>
                    )}
                </select>
              </InputGroupAddon>
              <Input placeholder="Summoner Name" type="text" name="summonerName" onChange={(event) => this.handleChange(event)}/>
              <InputGroupAddon addonType="append">
                <Button type="submit">Submit</Button>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </div>

        {this.state.loading ? <div><MyLoader/></div>:
          Object.keys(this.state.accInfo).length === 0 ? null :
          <div>
            <Info vers={this.state.vers} info={this.state.accInfo}/>
            <Match vers={this.state.vers} sumId= {this.state.accInfo.id} matches={this.state.matches} matchData={this.state.matchData}/>
          </div>
        }
      </div>
    );
  }
}

class Info extends Component{
  render() {
    const vers = this.props.vers;
    const info = this.props.info;
    return (
      <div>
        {info.name} : 
        <img src={'http://ddragon.leagueoflegends.com/cdn/' + vers +'/img/profileicon/' + info.profileIconId + '.png'}
        alt={info.profileIconId} key={info.profileIconId} height='50px' width='50px'/>
      </div>
    );
  }
}

class Match extends Component{
  render() {
    const sumId = this.props.sumId;
    const vers = this.props.vers;
    const matches = this.props.matches;
    const matchData = this.props.matchData;
    const champions = championData.data;
    let extracts = [];
    let matchIds = [];
    matchData.forEach((val) => extracts.push(val.data));
    matches.forEach((match) => matchIds.push(match.gameId));
    
    let wins = matchExtraction(sumId, matchIds, extracts);

    return (
      <div>
        {
          Object.keys(matches).map((match) =>
            <div key={match}> 
              {matches[match].gameId} : {matches[match].lane} : 
              {champions[matches[match].champion].name} : 
              <img src={'http://ddragon.leagueoflegends.com/cdn/' + vers + '/img/champion/' + champions[matches[match].champion].image.full}
              alt={matches[match].champion} key={matches[match].champion} height='50px' width='50px'/> 
              : {wins[match].mode} : {wins[match].wins !== 'Fail' ? 'Victory' : 'Defeat'}
            </div>
          )
        }
      </div>
    );
  }
}
 
function matchExtraction(sumId, matchIds, extracts){
    let partId = [];
    let teamId = [];
    let wins = [];
    console.log(extracts);
    extracts.forEach((game) => {
      game.participantIdentities.forEach((participant) => {
        if (participant.player.summonerId === sumId){
          partId.push(participant.participantId);
        }
      })
    });
    
    for (var i = 0; i < extracts.length; i++) {
      let part = extracts[i].participants;
      for (var j = 0; j < part.length; j++) {
        if(part[j].participantId === partId[i]){
          teamId.push(part[j].teamId);
        }
      }
    }

    for (var k = 0; k < extracts.length; k++) {
      let team = extracts[k].teams;
      if (team[0].teamId === teamId[k]){
        let mode = {};
        mode["mode"] = extracts[k].gameMode; 
        mode["wins"] = team[0].win;
        wins.push(mode);
      } else {
        let mode = {};
        mode["mode"] = extracts[k].gameMode; 
        mode["wins"] = team[1].win;
        wins.push(mode);
      }
    }

    return wins;
}

const MyLoader = () => (
    <ContentLoader
        className={"loader"}
        height={200}
        width={400}
        speed={2}
        primaryColor={"#FFFFFF"}
        secondaryColor={"#6D6986"}
    >
        <circle cx="185" cy="80" r="41" /> 
        <rect x="233" y="80" rx="5" ry="5" width="85" height="10" /> 
        <rect x="52" y="80" rx="5" ry="5" width="85" height="10" /> 
        <rect x="92" y="130" rx="5" ry="5" width="200" height="10" /> 
        <rect x="45" y="150" rx="5" ry="5" width="300" height="10" /> 
        <rect x="114" y="170" rx="5" ry="5" width="150" height="10" />
    </ContentLoader>
);

export default App;