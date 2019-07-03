const API = 'https://aneux.kheops.online/api'
var arrayPatientID = []
var arrayStudyUID = []
var patientNotFound = []
let token = ''

function sendAll() {
  let albumSource = $('#albumSource')[0].value
  let albumTarget = $('#albumTarget')[0].value
  let i = 0
  let errText = ''
  $('#sendInfo').text('')
  arrayStudyUID.forEach(studyUID => {
    $.ajax({
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      url: `${API}/studies/${studyUID}/albums/${albumTarget}?album=${encodeURIComponent(albumSource)}`,
      error: function(err) {
        $('#sendInfo').text(`${i} studies send`)
      },
      success: function(result) {
        i+=1
        $('#sendInfo').text(`${i} studies send`)
      }
    });
  })
}

function readCSV() {
  var files = document.getElementById('csvFile').files[0];
  var reader = new FileReader();

  reader.readAsText(files);

  reader.onload = function(event){
    let value = event.target.result.replace(/\r/g, "\n")
    let csvParsed = value.split("\n").map(function(row){
      if(row !== '') {
        return row.split(",")
      }
    })
    arrayPatientID = csvParsed.filter(function (el) {
      return el !== undefined;
    });
    $('#infoFile').text('')
    setDisableSendButton()
    $('#infoFile').append(`${arrayPatientID.length} patient ID`)
    if (arrayPatientID.length > 0) {
      setPatientID()
    }
  }
}

function setPatientID() {
  $('#infoStudies').text('')
  let albumSource = $('#albumSource')[0].value
  let nextRequests,
    results = [],
    arrayRequests = [];
  patientNotFound = []
  arrayPatientID.forEach(patientID => {
    nextRequests = $.ajax({
      headers: {
        'Authorization': `Bearer ${token}`
      },
      url: `${API}/studies?PatientID=${encodeURIComponent(patientID)}&album=${encodeURIComponent(albumSource)}`,
      success: function(study) {
        if (study === undefined) {
          patientNotFound.push(patientID)
        }
        results.push(study)
      }
    });
    arrayRequests.push(nextRequests)
  })
  let resultsFiltered = []
  $.when.apply($, arrayRequests).then(function() {
    arrayStudyUID = []
    resultsFiltered = results.filter(function (el) {
      return el !== undefined;
    });
    resultsFiltered.forEach(studies => {
      studies.forEach(study => {
        arrayStudyUID.push(study['0020000D']['Value'][0])
      })
    })
    $('#infoStudies').text(`${arrayStudyUID.length} studies in the album selected.`)
    $('#infoPatientID').text('')
    if (patientNotFound.length > 0) {
      for (id in patientNotFound) {
        $('#infoPatientID').append(`<li>${patientNotFound[id]}</li>`)
      }
    }
    setDisableSendButton()
  });
}

function getAlbums(token) {
  $('#albumSource')
    .find('option')
    .remove()
    .end()
  $('#albumTarget')
    .find('option')
    .remove()
    .end()
  $.ajax({
    headers: {
      'Authorization': `Bearer ${token}`
    },
    url: `${API}/albums`,
    error: function(jqXHR) {
        $('#tokenValue').text('Token not valid')
    },
    success: function(albums) {
      $('#tokenValue').text('Token valid')
      for (id in albums) {
        $('#albumSource').append(`<option value="${albums[id].album_id}" text="${albums[id].name}">${albums[id].name}</option>`)
        $('#albumTarget').append(`<option value="${albums[id].album_id}" text="${albums[id].name}">${albums[id].name}</option>`)
      }
       setDisableSendButton()
    }
  });
}

function setDisableSendButton() {
  if (arrayPatientID.length > 0 && arrayStudyUID.length > 0 && $('#albumTarget')[0].value !== '' && $('#albumSource')[0].value !== '') {
    $('#sendData').prop("disabled", false)
  } else {
    $('#sendData').prop("disabled", true)
  }
}

function initToken() {
  token = $('#token')[0].value
  getAlbums(token)
}
