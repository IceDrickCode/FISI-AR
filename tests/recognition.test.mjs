import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseBestMatch } from '../public/recognition-choice.js';
const c=(index,inliers)=>({index,inliers,modelViewTransform:[[1,0,0,0],[0,1,0,0],[0,0,1,3]]});
test('El mejor letrero gana aunque otro parecido aparezca antes en el catálogo',()=>{
  assert.equal(chooseBestMatch([c(0,12),c(1,42),c(2,18)]).index,1);
  assert.equal(chooseBestMatch([c(2,18),c(1,42),c(0,12)]).index,1);
});
test('Una coincidencia débil o ambigua no identifica un ambiente por orden',()=>{
  assert.equal(chooseBestMatch([c(0,5)]),null);
  assert.equal(chooseBestMatch([c(0,30),c(1,30)]),null);
  assert.equal(chooseBestMatch([c(1,39),c(0,40)]),null);
  assert.equal(chooseBestMatch([c(2,18)]).index,2);
  assert.equal(chooseBestMatch([{...c(0,100),modelViewTransform:null}]),null);
});
