import React, { Component } from 'react';
import Header from './header';
import axios from 'axios';
import ContentLoader from 'react-content-loader';
import './App.css';

const key = "RGAPI-a7e24e75-6b2d-4e4a-8f58-fa5ffb31de07";
const region = {'Russia':'ru', 'Korea':'kr', 'Brazil':'br1', 
                'Oceania':'oc1', 'Japan':'jp1', 'North America':'na1', 
                'Europe Nordic & East':'eun1', 'Europe West':'euw1', 
                'Turkey':'tr1', 'Latin America North':'la1', 
                'Latin America South':'la2'};

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
    if (name === null || name === ''){
      alert(`Name field is empty!`);
    } else {
      this.setState({loading: true});
      axios.get(`https://${region[server]}.api.riotgames.com/lol/summoner/v3/summoners/by-name/${name}?api_key=${key}`, {})
      .then(
        (response) => {
          this.setState({
            summonerName: response.data.name,
            accInfo: response.data
          });
          const acc = this.state.accInfo;
          return axios.get(`https://${region[server]}.api.riotgames.com/lol/match/v3/matchlists/by-account/${acc['accountId']}/recent?api_key=${key}`, {});
        }
      ).then(
        (response) => {
          this.setState({
            matches: response.data.matches,
          });
          var promises = [];
          this.state.matches.forEach((val) => {
            let url = `https://${region[server]}.api.riotgames.com/lol/match/v3/matches/${val.gameId}?api_key=${key}`;
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
        <form className="form" onSubmit={this.handleSubmit}>
          <input placeholder="Summoner Name" type="text" name="summonerName" onChange={(event) => this.handleChange(event)}/>
          <select value={this.state.region} name="region" onChange={(event) => this.handleChange(event)}>
              {Object.keys(region).map((server)=>
                <option key={server} value={server}>{server}</option>
              )}
          </select>
          <button type="submit">Submit</button>
        </form>

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
        {
          Object.keys(info).length === 0 ? null : 
            Object.keys(info).map((val) => 
              val === "profileIconId" ? 
                <img src={'http://ddragon.leagueoflegends.com/cdn/' + vers +'/img/profileicon/' + info[val] + '.png'}
                alt={info[val]} key={val} height='50px' width='50px'
                /> :
              val === "revisionDate" ? null : 
                <div key={val}>
                  {val}: {info[val]}
                </div>
            )
        }
      </div>
    );
  }
}

class Match extends Component{
  render() {
    const sumId = this.props.sumId;
    // const vers = this.props.vers;
    const matches = this.props.matches;
    const matchData = this.props.matchData;
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
              {matches[match].gameId} : {matches[match].lane} : {matches[match].champion} : {wins[match].mode} : {wins[match].wins} 
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
export default App;
