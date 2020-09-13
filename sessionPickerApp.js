import { el, list, mount } from "./redom.js";

class SessionDate {
  update({ label, value }) {
    const inputId = `session-${label.day}`;

    this.el = el(".dib.mr3",
      el(".flex.items-center",
        el("input.dn", {type: "radio", name: "session_date", id: inputId, value}),
        el("label.ba.ph3.pv2.b--black-40.pointer", {for: inputId},
          [
            el(".f4.tc", label.day),
            el(".f5", label.date)
          ]
        )
      )
    );
  }
}

class SessionTime {
  update({ label, value }) {
    const inputId = `session-${value}`;

    this.el = el(".dib.mr3",
      el(".flex.items-center",
        el("input.dn", {type: "radio", name: "session[time]", id: inputId, value}),
        el("label.ba.ph3.pv2.b--black-40.pointer", {for: inputId},
          el(".f4.tc", label)
        )
      )
    );
  }
}

export default class SessionPickerApp {
  constructor({ SessionDictionary, startDate, advancedBookingDays, locale, targets }) {
    this.defaultLocale = locale;
    this.defaultLocale || (this.defaultLocale = 'en-AU');

    this.SessionDictionary = SessionDictionary;
    this.defaultStartDate = startDate;
    this.advancedBookingDays = advancedBookingDays;

    this.targetDateEl = document.getElementById(targets.sessionDateId);
    this.targetTimeEl = document.getElementById(targets.sessionTimeId);

    this.availableDatesEl = list("div", SessionDate);
    this.availableTimesEl = list(el(".f4", "Please pick a date"), SessionTime, "value");

    mount(this.targetDateEl, this.availableDatesEl);
    mount(this.targetTimeEl, this.availableTimesEl);
  }

  listen() {
    this.targetDateEl.addEventListener('click', this.showAvailableTimes.bind(this));
  }

  // private

  showAvailableDates() {
    this.availableDatesEl.update(
      this.availableDates(this.startDate)
    );
  }

  showAvailableTimes(eventData) {
    if (eventData.target && !eventData.target.matches('input[type="radio"]')) return;

    this.availableTimesEl.update(
      this.availableTimes(
        this.SessionDictionary[eventData.target.value]
      )
    );
  }

  availableDates(startDate) {
    const result = [];

    let dateTime = startDate;
    for (let i = -1; i < this.advancedBookingDays; i++) {
      result.push({
        label: {
          day: this.format(dateTime, 'longWeekday'),
          date: this.format(dateTime, 'ddmmmyyyy')
        },
        value: this.format(dateTime, 'shortWeekday')
      });

      dateTime = this.nextDate(dateTime);
    }

    return result;
  }

  availableTimes(times) {
    const result = [];

    let dateTime = new Date;
    for(let i = 0; i < times.length;) {
      const j = i + 1;

      if (!times[j]) break;

      const label = `${this.format(dateTime.setHours(times[i]), 'hourOfDay').replace(' ', '')} - ${this.format(dateTime.setHours(times[j]), 'hourOfDay').replace(' ', '')}`;

      result.push({ label, value: times[i]} );

      i = j;
    }

    return result;
  }

  get startDate() {
    if (this.defaultStartDate) {
      return this.defaultStartDate;
    }

    const today = new Date;
    if (this.canBook(today)) {
      return today;
    } else {
      return this.nextDate(today);
    }
  }

  canBook(dateTime) {
    const hour = dateTime.getHours();
    const day = this.format(dateTime, 'shortWeekday');

    return this.SessionDictionary[day].some((sessionHour) => hour < sessionHour);
  }

  nextDate(dateTime) {
    const dayAfter = new Date(dateTime);
    dayAfter.setDate(dateTime.getDate() + 1);

    return dayAfter;
  }

  format(dateTime, style, locale) {
    switch(style) {
      case 'hourOfDay':
        style = { hour: 'numeric' };
        break;

      case 'shortWeekday':
        style = { weekday: 'short'};
        break;

      case 'longWeekday':
        style = { weekday: 'long'};
        break;

      case 'ddmmmyyyy':
      default:
        style = { day: 'numeric', month: 'short', year: 'numeric' };
        break;
    }

    locale || (locale = this.defaultLocale);

    return new Intl.DateTimeFormat(locale, style).format(dateTime);
  }
}
