// Version-pinned MindAR 1.2.5 worker protocol; matching/pose math remains MindAR's.
import { Matcher } from 'mind-ar/src/image-target/matching/matcher.js';
import { Estimator } from 'mind-ar/src/image-target/estimation/estimator.js';
import { chooseBestMatch } from '../public/recognition-choice.js';
let matcher,estimator,matchingDataList;
self.onmessage=({data})=>{
  if(data.type==='setup'){
    matchingDataList=data.matchingDataList;
    matcher=new Matcher(data.inputWidth,data.inputHeight,false);
    estimator=new Estimator(data.projectionTransform);
  }else if(data.type==='match'){
    const candidates=[];
    for(const index of data.targetIndexes){
      const match=matcher.matchDetection(matchingDataList[index],data.featurePoints);
      if(match.keyframeIndex===-1)continue;
      const modelViewTransform=estimator.estimate({screenCoords:match.screenCoords,worldCoords:match.worldCoords});
      if(modelViewTransform)candidates.push({index,inliers:match.screenCoords.length,modelViewTransform});
    }
    const best=chooseBestMatch(candidates);
    postMessage({type:'matchDone',targetIndex:best?.index??-1,modelViewTransform:best?.modelViewTransform??null,
      debugExtra:{candidates:candidates.map(c=>({index:c.index,inliers:c.inliers})),ambiguous:!best&&candidates.length>0}});
  }else if(data.type==='trackUpdate'){
    const modelViewTransform=estimator.refineEstimate({initialModelViewTransform:data.modelViewTransform,worldCoords:data.worldCoords,screenCoords:data.screenCoords});
    postMessage({type:'trackUpdateDone',modelViewTransform});
  }else if(data.type==='dispose')close();
};
