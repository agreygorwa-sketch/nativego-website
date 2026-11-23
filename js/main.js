/* ============================================================
   main.js — the JavaScript for the whole NativeGo site.
   One file, linked from every page. Plain JavaScript, no library:
   the site must stay light (NFR-01: pages load in under 3 seconds
   on a modest mobile connection). Four small jobs, each in its
   own block, each with a comment that says what it does.
   ============================================================ */

/* Job 0 — Tell the stylesheet that JavaScript is running. The CSS
   hides the phone menu only when this "js" class is present, so the
   menu still works when JavaScript is off. */
document.documentElement.classList.add("js");

/* Job 1 — The Menu button on a phone. It opens and closes the menu,
   and updates aria-expanded so a screen reader knows the state. */
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("nav");
  if (!toggle || !nav) {
    return; /* no menu button on this page: nothing to do */
  }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();

/* Job 2 — Highlight the page you are on in the menu. The link whose
   address matches this page gets the "active" class, which the CSS
   colours orange with an underline. */
(function () {
  var here = window.location.pathname;
  if (here.charAt(here.length - 1) === "/") {
    here += "index.html"; /* a folder address means its index page */
  }
  var links = document.querySelectorAll("nav a");
  links.forEach(function (link) {
    var target = new URL(link.getAttribute("href"), window.location.href).pathname;
    if (target === here) {
      link.classList.add("active");
    }
  });
})();

/* Job 3 — Check every form before it is sent. One rule per field:
   a required field must not be empty; an email field must look like
   an email; a password must be at least 8 characters; a number must
   stay inside its allowed range. A bad field gets a red border and a
   message under it, the form is stopped, and the first bad field is
   focused. Fixing a field clears its message straight away. */
function fieldMessage(field) {
  /* Work out what is wrong with this one field, if anything. */
  var value = field.value.trim();
  if (field.required && value === "") {
    return "This field is required.";
  }
  if (field.type === "email" && value !== "" && /^\S+@\S+\.\S+$/.test(value) === false) {
    return "Enter an email address like name@example.com.";
  }
  if (field.type === "password" && value !== "" && field.minLength > 0 && value.length < field.minLength) {
    return "Use at least " + field.minLength + " characters.";
  }
  if (field.type === "number" && value !== "") {
    var number = Number(value);
    if (field.min !== "" && number < Number(field.min)) {
      return "Enter a number of " + field.min + " or more.";
    }
    if (field.max !== "" && number > Number(field.max)) {
      return "Enter a number of " + field.max + " or less.";
    }
  }
  return ""; /* nothing wrong */
}

function showError(field, message) {
  /* Put the message in a <p> right under the field, or update it
     if it is already there. The message always sits directly after
     its field, so each field owns its own message. */
  var next = field.nextElementSibling;
  var error = (next && next.classList.contains("field-error")) ? next : null;
  if (!error) {
    error = document.createElement("p");
    error.className = "field-error";
    field.insertAdjacentElement("afterend", error);
  }
  error.textContent = message;
  field.setAttribute("aria-invalid", "true");
}

function clearError(field) {
  var next = field.nextElementSibling;
  if (next && next.classList.contains("field-error")) {
    next.remove();
  }
  field.removeAttribute("aria-invalid");
}

function checkField(field) {
  /* Check one field and show or clear its message. Returns true
     when the field is fine. Checkboxes and radio buttons are
     skipped: none of them is required on this site. */
  if (field.type === "checkbox" || field.type === "radio") {
    return true;
  }
  var message = fieldMessage(field);
  if (message === "") {
    clearError(field);
    return true;
  }
  showError(field, message);
  return false;
}

document.querySelectorAll("form").forEach(function (form) {
  form.addEventListener("submit", function (event) {
    var fields = form.querySelectorAll("input, select, textarea");
    var firstBad = null;
    fields.forEach(function (field) {
      if (checkField(field) === false && firstBad === null) {
        firstBad = field;
      }
    });
    if (firstBad !== null) {
      event.preventDefault(); /* stop a bad submit */
      firstBad.focus();
      return;
    }
    /* A demonstration form: the fields are checked here, but the
       real saving happens on the live system, so go there instead
       of sending anything from this static page. */
    var goTo = form.getAttribute("data-go-to");
    if (goTo) {
      event.preventDefault();
      window.location.href = goTo;
      return;
    }
    /* The request form: go to the chosen provider's live profile,
       where the real request is sent. */
    if (form.hasAttribute("data-go-to-provider")) {
      event.preventDefault();
      var provider = form.querySelector("#provider");
      window.location.href = "https://nativego-flask.vercel.app/provider/" + provider.value;
    }
    /* A form with no data-go-to (the contact form, the guide
       search) submits normally, exactly as before. */
  });
  /* As soon as you fix a field, its message goes away. */
  form.addEventListener("input", function (event) {
    checkField(event.target);
  });
});

/* Job 5 — Topbar shadow on scroll. Once you scroll past the top, the
   sticky topbar gains its border and shadow, like the Flask topbar. */
(function () {
  var bar = document.getElementById("topbar");
  if (!bar) {
    return;
  }
  function onScroll() {
    bar.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

/* Job 4 — Live filter on the Guides page. As you type, the guide
   cards and the rows of the comparison table are hidden unless their
   text contains what you typed. With an empty box, everything shows.
   Nothing is sent anywhere: this runs entirely in the browser. */
(function () {
  var filter = document.getElementById("guide-filter");
  if (!filter) {
    return; /* this page has no filter box: nothing to do */
  }
  var empty = document.getElementById("filter-empty");
  filter.addEventListener("input", function () {
    var query = filter.value.trim().toLowerCase();
    var shown = 0;
    document.querySelectorAll(".card").forEach(function (card) {
      var match = card.textContent.toLowerCase().indexOf(query) !== -1;
      card.hidden = !match;
      if (match) {
        shown += 1;
      }
    });
    document.querySelectorAll("table tbody tr").forEach(function (row) {
      var match = row.textContent.toLowerCase().indexOf(query) !== -1;
      row.hidden = !match;
      if (match) {
        shown += 1;
      }
    });
    if (empty) {
      empty.hidden = !(query !== "" && shown === 0);
    }
  });
})();
