/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const startButton = document.getElementById('startButton');
const startButton2 = document.getElementById('startButton2');
const hangupButton = document.getElementById('hangupButton');
hangupButton.disabled = true;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let pc;
let localStream;

const signaling = new BroadcastChannel('webrtc');

socket.addEventListener('message', ev => {
	
	console.log(ev);
	console.log('received: ' + ev.data);

	const data = JSON.parse(ev.data);

	if (!localStream) {
		console.log('not ready yet');
		return;
	}
	
	switch (data.type) {
    case 'offer':
		handleOffer(data);
		break;
    case 'answer':
		handleAnswer(data);
		break;
    case 'candidate':
		handleCandidate(data);
		break;
    case 'ready':
		// A second tab joined. This tab will initiate a call unless in a call already.
		if (pc) {
			console.log('already in call, ignoring');
			return;
		}
		makeCall();
		break;
    case 'bye':
		if (pc) {
			hangup();
		}
		break;
    default:
		console.log('unhandled msg:', e);
		break;
	}
  
});

// send signaling message: {type: msg}
function sendMessage(msg) {
	const str = JSON.stringify(msg)
	socket.send(str);
}


startButton.onclick = async () => {
	
  localStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
  localVideo.srcObject = localStream;


  startButton.disabled = true;
  hangupButton.disabled = false;

  sendMessage({type: 'ready'});
};


hangupButton.onclick = async () => {
  hangup();
  sendMessage({type: 'bye'});
};


async function hangup() {
  if (pc) {
    pc.close();
    pc = null;
  }
  localStream.getTracks().forEach(track => track.stop());
  localStream = null;
  startButton.disabled = false;
  hangupButton.disabled = true;
};

function createPeerConnection() {
  pc = new RTCPeerConnection();
  pc.onicecandidate = e => {
    const message = {
      type: 'candidate',
      candidate: null,
    };
    if (e.candidate) {
      message.candidate = e.candidate.candidate;
      message.sdpMid = e.candidate.sdpMid;
      message.sdpMLineIndex = e.candidate.sdpMLineIndex;
    }
    sendMessage(message);
  };
  pc.ontrack = e => remoteVideo.srcObject = e.streams[0];
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

async function makeCall() {
  await createPeerConnection();

  const offer = await pc.createOffer();
  sendMessage({type: 'offer', sdp: offer.sdp});
  await pc.setLocalDescription(offer);
}

async function handleOffer(offer) {
  if (pc) {
    console.error('existing peerconnection');
    return;
  }
  await createPeerConnection();
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  sendMessage({type: 'answer', sdp: answer.sdp});
  await pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
  if (!pc) {
    console.error('no peerconnection');
    return;
  }
  await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
  if (!pc) {
    console.error('no peerconnection');
    return;
  }
  if (!candidate.candidate) {
    await pc.addIceCandidate(null);
  } else {
    await pc.addIceCandidate(candidate);
  }
}

