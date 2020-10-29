import { el, text, list, mount } from "./redom.js";

class SessionDate {
  update({ label, value }) {
    const inputId = `session-${label.day}`;

    this.el = el(".dib.mr3",
      el(".flex.items-center",
        el("input.dn", {type: "radio", name: "session[date]", id: inputId, value, required: true}),
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
  constructor (initData, item, i, data) {
    const { label, value, peopleCount } = item;
    const inputId = `session-${value}`;

    this.peopleCountText = text("");

    this.el = el(".dib.mr3",
      el(".flex.items-center",
        el("input.dn", {type: "radio", name: "session[time]", id: inputId, value, required: true}),
        el("label.ba.ph3.pv2.b--black-40.pointer", {for: inputId},
          el(".f4.tc", label),
          el(".mt1.f5.tc", {title: 'number of people booked'}, this.peopleCountText)
        )
      )
    );

    this.update(item);
  }

  update({ peopleCount }) {
    if (typeof peopleCount === 'number') {
      this.peopleCountText.textContent = `${peopleCount} ‡`;
    }
  }
}

export default class SessionPickerApp {
  constructor({
    SessionDictionary,
    PeopleCountDictionary,
    TimeslotInformation,
    startDate,
    advancedBookingDays,
    unavailableDates,
    locale,
    targets
  }) {
    this.defaultLocale = locale;
    this.defaultLocale || (this.defaultLocale = 'en-AU');

    this.SessionDictionary = SessionDictionary;
    this.PeopleCountDictionary = PeopleCountDictionary;
    this.TimeslotInformation = TimeslotInformation;

    this.defaultStartDate = startDate;

    this.advancedBookingDays = advancedBookingDays;
    this.unavailableDates = unavailableDates || [];

    this.targetDateEl = document.getElementById(targets.sessionDateId);
    this.targetTimeEl = document.getElementById(targets.sessionTimeId);

    this.availableDatesEl = list("div", SessionDate);
    this.availableTimesEl = list(el(".f4", "Please pick a date."), SessionTime, "value");

    mount(this.targetDateEl, this.availableDatesEl);
    mount(this.targetTimeEl, this.availableTimesEl);
  }

  listen() {
    this.targetDateEl.addEventListener(
      'click',
      (eventData) => {
        if (eventData.target && !eventData.target.matches('input[type="radio"]')) return;
        this.showAvailableTimes(eventData.target.value);
      }
    );
  }

  showAvailableDates() {
    this.availableDatesEl.update(
      this.availableDates()
    );
  }

  showAvailableTimes(day) {
    this.availableTimesEl.update(
      this.availableTimes(day)
    );

    if (!this.timeslotInformationEl) {
      this.timeslotInformationEl = el('.mt2.f5', this.TimeslotInformation);
      this.targetTimeEl.appendChild(this.timeslotInformationEl);
    }
  }

  // private

  availableDates(startDate) {
    startDate || (startDate = this.startDate);
    const result = [];

    let dateTime = startDate;
    for (let i = -1; i < this.advancedBookingDays; i++) {
      while(this.isUnavailableDate(dateTime)) {
        dateTime = this.nextDate(dateTime);
      }

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

  isUnavailableDate(dateTime) {
    const ddmmmyyyy = this.format(dateTime, 'ddmmmyyyy');
    return this.unavailableDates.includes(ddmmmyyyy);
  }

  availableTimes(day) {
    const timeslots = this.SessionDictionary[day];
    const result = [];

    let dateTime = new Date;
    for(let i = 0; i < timeslots.length;) {
      const j = i + 1;

      if (!timeslots[j]) break;

      const label = `${this.format(dateTime.setHours(timeslots[i]), 'hourOfDay').replace(' ', '')} - ${this.format(dateTime.setHours(timeslots[j]), 'hourOfDay').replace(' ', '')}`;
      const value = timeslots[i];
      const peopleCount = (this.PeopleCountDictionary[day] || {})[value];

      result.push({ label, value, peopleCount });

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
