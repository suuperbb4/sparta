#!/usr/bin/env bash
# 효과음 합성 (외부 음원 없이 ffmpeg로 생성 → 저작권 문제 없음). 결과: public/sfx/*.wav
set -e
cd "$(dirname "$0")/../public" && mkdir -p sfx && cd sfx
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.9*sin(2*PI*(42+60*exp(-8*t))*t)*exp(-3.2*t)':s=48000:d=1.8" -f lavfi -i "anoisesrc=c=brown:d=1.8:a=0.5:r=48000" -filter_complex "[1]lowpass=f=180,afade=t=out:st=0:d=0.6[n];[0][n]amix=inputs=2:weights=1 0.8,alimiter=limit=0.9" -ac 2 impact.wav
ffmpeg -v error -y -f lavfi -i "anoisesrc=c=pink:d=1.1:a=0.6:r=48000" -af "bandpass=f=900:w=1.5,afade=t=in:st=0:d=0.45,afade=t=out:st=0.5:d=0.6,volume=1.6" -ac 2 whoosh.wav
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.6*sin(2*PI*1800*t)*exp(-70*t)+0.3*sin(2*PI*3600*t)*exp(-90*t)':s=48000:d=0.15" -ac 2 tick.wav
ffmpeg -v error -y -f lavfi -i "aevalsrc='0.35*sin(2*PI*(120*t+90*t*t))*(t/1.4)':s=48000:d=1.4" -f lavfi -i "anoisesrc=c=white:d=1.4:a=0.25:r=48000" -filter_complex "[1]highpass=f=2000,afade=t=in:st=0:d=1.3[n];[0][n]amix=inputs=2,afade=t=out:st=1.25:d=0.15" -ac 2 riser.wav
echo "효과음 생성 완료: $(ls)"
