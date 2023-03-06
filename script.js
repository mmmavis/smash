const ANIMATION_DELAY = 2000; // in ms
const FIREBASE_CONFIG = generateFirebaseConfig(
  `AIzaSyBvp8I4B_57syWZ6BoFI9KxeZDagT75dcI`,
  `simon-smash`
);
const MODAL_OPEN_CLASS = "modal-opened";
var formattedNotes;

firebase.initializeApp(FIREBASE_CONFIG.CONFIG);

firebase
  .auth()
  .signInAnonymously()
  .catch(function (error) {
    console.log("error", error);
  });

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    // var isAnonymous = user.isAnonymous;
    // var uid = user.uid;
    // console.log("user");

    setTimeout(function () {
      renderAllNotes(function () {
        setTimeout(function () {
          // $("#inner-wrapper").append("<div style='clear: both;'></div>");
          $("#new-form-wrapper").append(
            "<div>" + createHTML({}, "new-note-template") + "</div>"
          );
          $("#loading-screen").addClass("hide");
        }, ANIMATION_DELAY);
      });
    }, 1500);
  } else {
    // User is signed out.
    // console.log("out");
  }
});

Handlebars.registerHelper("localTime", function (timestamp) {
  return moment.unix(timestamp / 1000).format("YYYY-MM-DD hh:mma");
});

function formatFirebaseNotes(fbNotes) {
  let notes = {};
  let count = 0;

  for (key in fbNotes) {
    let note = fbNotes[key];
    notes[note.character] = note;
    notes[note.character].id = key;

    var charGrid = $(".grid-item[data-character='" + note.character + "']");
    if (charGrid) {
      charGrid.addClass("claimed");
      count++;
      charGrid.attr("data-player-number", count);
    }
  }

  formattedNotes = notes;
}

function renderAllNotes(done) {
  firebase
    .database()
    .ref(FIREBASE_CONFIG.DB_PATH)
    .once("value")
    .then(function (snapshot) {
      var notes = snapshot.val();

      try {
        var numNotes = Object.keys(notes).length;
        var currIndex = 0;
      } catch (parseError) {
        done();
      }

      if (numNotes === 0) {
        done();
      }

      formatFirebaseNotes(notes);
      done();

      /* not used for Smash
      function renderNotesWithDelay() {
        var key = Object.keys(notes)[currIndex];
        var currentNote = notes[key];

        currentNote.id = key;
        renderNote(currentNote);

        currIndex += 1;
        if (currIndex <= numNotes - 1) {
          setTimeout(renderNotesWithDelay, ANIMATION_DELAY);
        } else {
          done();
        }
      }

      renderNotesWithDelay();
      */
    });
}

function createHTML(data, templateId) {
  var source = document.getElementById(templateId).innerHTML;
  var template = Handlebars.compile(source);

  return template(data);
}

function getFileExtensionFromLink(url) {
  var extension;
  var mediaType = "webpage";

  try {
    extension = url.split(".").pop().split(/\#|\?/g)[0];

    switch (extension.toLowerCase()) {
      case "":
        mediaType = false;
        break;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        mediaType = "image";
        break;
      case "mp4":
      case "avi":
      case "mpg":
        mediaType = "video";
    }
  } catch (error) {
    console.error(error);
  }

  return {
    extension: extension,
    mediaType: mediaType,
  };
}

function isSrcVideo(filename = "") {
  var ext = filename.split("?")[0].split(".").pop();

  switch (ext.toLowerCase()) {
    case "mp4":
    case "avi":
    case "mpg":
      return true;
  }

  return false;
}

function renderNote(note) {
  switch (getFileExtensionFromLink(note.imgSrc).mediaType) {
    case "video":
      note.imgSrcIsVideo = true;
      break;
    case "webpage":
      note.imgSrcIsWebpage = true;
  }

  $("#message-wrapper").html(createHTML(note, "note-template"));

  if (note.character) {
    var charGrid = $(".grid-item[data-character='" + note.character + "']");
    charGrid.addClass("claimed");
    charGrid.attr("data-imgSrc", note.imgSrc);
    charGrid.attr("data-message", note.message);
    charGrid.attr("data-submitter", note.submitter);
    charGrid.attr("data-timestamp", note.timestamp);
  }
}

// send new note
$("body").on("submit", "#new-note-form", function (event) {
  event.preventDefault();
  var ref = firebase.database().ref(FIREBASE_CONFIG.DB_PATH).push();
  var task = ref.set(
    {
      timestamp: Date.now().toString(),
      message: $(this).find("[name=message]").val().replace(/\n/g, "<br>"),
      submitter: $(this).find("[name=submitter]").val(),
      imgSrc: $(this).find("[name=imgSrc]").val(),
      // gemType: $(this).find("[name=gemType]:checked").val(),
      character: $("#modal").attr("data-character-selected"),
    },
    function complete() {
      // reload page so new notes shows... a cheat...
      window.location.reload(true);
      // done();
    }
  );
});

// FIXME: can't recall what this was for
// $("body").on(
//   "change",
//   "#new-note-form input[type=radio][name=bgColor]",
//   function (event) {
//     $.each($("input[type=radio][name=bgColor]"), function (index, option) {
//       $("#new-note").removeClass(option.value);
//     });

//     $("#new-note").addClass(this.value);
//   }
// );

function showModal() {
  $("#page-overlay").addClass(MODAL_OPEN_CLASS);
  var char = $("#modal").attr("data-character-selected");
  console.log(char, formattedNotes[char]);

  if (formattedNotes[char]) {
    $("#new-form-wrapper").addClass("hide");
    $("#message-wrapper").removeClass("hide");
    renderNote(formattedNotes[char]);
  } else {
    $("#new-form-wrapper").removeClass("hide");
    $("#message-wrapper").addClass("hide");
  }
}

function closeModal() {
  $("#page-overlay").removeClass(MODAL_OPEN_CLASS);
}

$(".grid-item").click(function () {
  var char = $(this).attr("data-character");
  var charImgSrc = "assets/characters/" + char.replace(/\s+/g, "-") + ".png";
  $("#modal").attr("data-character-selected", char);
  // $("#modal").css(
  //   "background-image",
  //   "url(assets/characters/" + char.replace(/\s+/g, "-") + ".png)"
  // );
  $("#character-selected").text(char);
  if ($("#modal .smash-bro-character-image img").length != 0) {
    $("#modal .smash-bro-character-image img").attr("src", charImgSrc);
  } else {
    $(".smash-bro-character-image").html("<img src='" + charImgSrc + "'>");
  }

  showModal();
});

$("#modal .btn-close").click(function (event) {
  event.preventDefault();
  closeModal();
});

$(document).keyup(function (e) {
  if (e.key === "Escape") {
    // escape key maps to keycode 27
    closeModal();
  }
});
