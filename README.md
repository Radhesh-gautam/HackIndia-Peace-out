# Memory Lens – AI + AR Smart Care System

Memory Lens is an AI and AR-based system designed to assist dementia patients by improving safety, awareness, and daily care through intelligent monitoring.

---

## Overview

Dementia patients often face:
- Memory loss and confusion  
- Difficulty recognizing people  
- Missed or incorrect medication  
- Wandering and safety risks  

Memory Lens addresses these using AR-based assistance and a caregiver dashboard.

---

## AR Model (AR-model/)

The AR module provides real-time assistance:

- Face recognition: identifies people, shows name, relation, and last interaction  
- Voice output: pronounces names for better recall  
- Medicine verification: detects and validates correct medicine  
- Smart interaction: audio-first, AR only when needed  

---

## Web Dashboard

The remaining folders contain the web application for monitoring:

- Patient profile: medical data and contacts  
- Live tracking: real-time location with safe-zone alerts  
- Health reports: activity and medication logs  
- Appointment booking: AI-assisted scheduling  
- Alert system: detects missed medication and inactivity  

---

## Project Structure

memory-lens/
├── AR-model/        # AI + AR model  
├── src/             # Frontend (React)  
├── public/          # Static files  
├── backend/         # API/server 

---

## Objective

To reduce dependency on constant supervision while ensuring patient safety through intelligent assistance.

---

## Safe AR Design

- AR is not always active  
- Audio-first interaction  
- Minimal and short usage  
- Designed to avoid confusion and overload  

---

## Market

- 55+ million dementia patients globally  
- 5.3 million in India  
- Growing demand for home-based care solutions  

---

## Tech Stack

- React (frontend)  
- Node.js / Express (backend)  
- Computer Vision (face + object detection)  
- AR via camera  
- Geolocation and alert systems  

---

## Setup

git clone https://github.com/Radhesh-gautam/HackIndia-Peace-out.git 
cd memory-lens  
npm install  
npm run dev  
npm start
py -3.11 main.py

---

## Future Scope

- Navigation assistance  
- Fall detection  
- Advanced AI predictions  
- Voice-based system  

---

Memory Lens is designed to make care more reliable, intelligent, and accessible.
