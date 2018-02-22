axios.get(`https://${region[server]}.api.riotgames.com/lol/static-data/v3/versions?api_key=${key}`, {})
.then(
  (response) => {
    this.setState({
      vers: response.data[0]
    });
  }
).catch( error => {alert(error);});

