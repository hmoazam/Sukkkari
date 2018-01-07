//Create an account on Firebase, and use the credentials they give you in place of the following
var config = {
    apiKey: "AIzaSyDMDXI5DjKxX9eldFoWN-P-5uU6kjblKPA",
    authDomain: "video-chat-f7fdb.firebaseapp.com",
    databaseURL: "https://video-chat-f7fdb.firebaseio.com",
    // projectId: "video-chat-f7fdb", //no need?
    storageBucket: "video-chat-f7fdb.appspot.com",
    messagingSenderId: "782431137044"
  };
firebase.initializeApp(config);

var database = firebase.database().ref();
var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var yourId = Math.floor(Math.random()*1000000000);
var servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'websitebeaver','username': 'websitebeaver@email.com'}]};

var track = null;
// var pc = bootConnection();


function bootConnection() {
  var pc = new RTCPeerConnection(servers);
  pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
  pc.onaddstream = (event => friendsVideo.srcObject = event.stream);  
  return pc;
}


function sendMessage(senderId, data) {
    var msg = database.push({ sender: senderId, message: data });
    msg.remove();
}

function readMessage(data) {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    if (sender != yourId) {
        if (msg.ice != undefined)
            pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if (msg.sdp.type == "offer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})));
        else if (msg.sdp.type == "answer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
};

database.on('child_added', readMessage);

function showMyFace() {
  navigator.mediaDevices.getUserMedia({audio:true, video:true})
    // .then(stream => yourVideo.srcObject = stream)
    .then(function(stream){
      yourVideo.srcObject = stream;
      track = stream.getTracks()[1];
      return stream;
    })
    // .then(stream => pc.addStream(stream));
    .then(function(stream){
      pc = bootConnection();
      pc.addStream(stream);
      return stream;
    })
}

function showFriendsFace() {
  // pc = new RTCPeerConnection(servers);
  // pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate})):console.log("Sent All Ice") );
  // pc.onaddstream = (event => friendsVideo.srcObject = event.stream);
  pc.createOffer()
    .then(offer => pc.setLocalDescription(offer) )
    .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription})) );

}

function endCall() {
  // pc.close()
  // localstream.stop;
  track.stop();
  pc.close();
  // alert('Call Ended!');
}