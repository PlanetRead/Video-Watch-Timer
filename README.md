Video Watch Timer

Project Overview

Video Watch Timer is a mobile-first application built to track how long users watch videos and analyze viewing behavior. It also includes features like PDF/video downloads and cloud
syncing for enhanced usability and analytics.

Tech Stack

React Native (Expo)

JavaScript / TypeScript

NativeWind (Tailwind for React Native)

Supabase (for cloud sync & backend)

Expo Video

Prerequisites

Before setting up the project, ensure you have:

Node.js (v16 or higher)

npm or Yarn

Expo CLI

npm install -g expo-cli

A mobile emulator or Expo Go app on your phone

Installation Steps

Clone the repository

git clone https://github.com/PlanetRead/Video-Watch-Timer.git

cd Video-Watch-Timer

Install dependencies

npm install

Setup environment variables

Copy .env.example to .env

cp .env.example .env

Add your Supabase credentials:

EXPO_PUBLIC_SUPABASE_URL=your_url

EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key

Running the Project

Start the development server:

npm start

Then:

Press a → Android emulator

Press i → iOS simulator

Or scan QR code using Expo Go

Folder Structure

Video-Watch-Timer/
│── app/ # Main app screens & navigation
│── components/ # Reusable UI components
│── assets/ # Images, PDFs, videos
│── utils/ # Utility functions & helpers
│── scripts/ # Helper scripts
│── index.js # Entry point
│── global.css # Global styles
│── tailwind.config.js # Tailwind/NativeWind config
│── .env.example # Environment variables template
│── package.json # Dependencies & scripts

Features

Track video watch duration

Basic analytics based on watch time

Cloud sync using Supabase

PDF and video download support

Translation support for videos

Mobile-friendly UI (Expo)

Contribution Guidelines

We welcome contributions!

Fork the repository

Create a new branch:

git checkout -b feature/your-feature-name

Make your changes

Commit:

git commit -m "feat: add your feature"

Push:

git push origin feature/your-feature-name

Open a Pull Request

Code Style / Standards

Follow consistent naming conventions

Use functional components in React Native

Keep components modular and reusable

Write clean and readable code

Use Tailwind (NativeWind) for styling

How to Submit PRs

Ensure your code runs without errors

Test features before submitting

Add a clear PR description

Link related issues (if any)

Keep PRs focused and minimal

Additional Notes

Ensure .env file is not committed

Supabase setup is required for full functionality

Expo environment is recommended for development

Future Improvements

Advanced analytics dashboard

User authentication

Performance optimization

Better UI/UX enhancements

Acknowledgements

Thanks to all contributors and the open-source community!
