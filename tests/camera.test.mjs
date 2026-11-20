import test from 'node:test';
import assert from 'node:assert/strict';
import { startCamera } from '../public/camera.js';

function fixture(t, getUserMedia) {
  const oldDoc=Object.getOwnPropertyDescriptor(globalThis,'document'),oldNav=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const video=new EventTarget();video.style={};video.videoWidth=640;video.videoHeight=480;
  video.setAttribute=()=>{};video.remove=()=>{video.removed=true};video.play=async()=>{video.played=true};
  Object.defineProperty(video,'srcObject',{set(value){this.stream=value;queueMicrotask(()=>video.dispatchEvent(new Event('loadedmetadata')))}});
  Object.defineProperty(globalThis,'document',{value:{createElement:()=>video},configurable:true});
  Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia}},configurable:true});
  t.after(()=>{if(oldDoc)Object.defineProperty(globalThis,'document',oldDoc);else delete globalThis.document;if(oldNav)Object.defineProperty(globalThis,'navigator',oldNav);else delete globalThis.navigator});
  let started=0;const system={container:{append(){}},_startAR:async()=>{started++}};
  return {video,system,get started(){return started}};
}

test('La cámara pide entrada acotada, sin audio, y arranca AR después de tener vídeo', async t => {
  let requested,focused=false;
  const track={stop(){},getCapabilities:()=>({focusMode:['continuous']}),applyConstraints:async()=>{focused=true}};
  const f=fixture(t,async constraints=>{requested=constraints;return{getTracks:()=>[track],getVideoTracks:()=>[track]}});
  await startCamera(f.system,{active:()=>true,onError:e=>{throw e}});
  assert.equal(requested.audio,false);assert.ok(requested.video.width.max<=960&&requested.video.height.max<=960);
  assert.equal(f.started,1);assert.equal(f.video.played,true);assert.equal(focused,true);
});

test('Permiso denegado informa el fallo y limpia el vídeo', async t => {
  const denied=new Error('Denied');let received;
  const f=fixture(t,async()=>{throw denied});
  await startCamera(f.system,{active:()=>true,onError:e=>{received=e}});
  assert.equal(received,denied);assert.equal(f.started,0);assert.equal(f.video.removed,true);
});

test('Un permiso que llega tras cerrar no deja la cámara encendida', async t => {
  let stopped=0;
  const f=fixture(t,async()=>({getTracks:()=>[{stop(){stopped++}}]}));
  await startCamera(f.system,{active:()=>false,onError:()=>assert.fail('Late failure')});
  assert.equal(stopped,1);assert.equal(f.started,0);assert.equal(f.video.removed,true);
});
