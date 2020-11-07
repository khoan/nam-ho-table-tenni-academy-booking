export default class BookingLoaderApp {
  constructor({
    url,
    PeopleCountDictionary,
    onLoad,
  }) {
    this.url = url;
    this.PeopleCountDictionary = PeopleCountDictionary;
    this.onLoad = onLoad;
  }

  run() {
    var url = new URL(this.url);
    url.search = new URLSearchParams({action: "index"}).toString();
    fetch(url)
      .then(response => response.json())
      .then(json => Object.assign(this.PeopleCountDictionary, json.body))
      .then(this.onLoad);
  }
}
