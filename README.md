# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Location & Maps (added)

- This project now includes `expo-location` and `react-native-maps` as dependencies in `package.json`.
- The default app (`app/index.tsx`) requests foreground location permission and logs the current coordinates to the console.
- To install native dependencies and run the app, follow the commands below.
- To install native dependencies and run the app, follow the commands below.

TODO: If you need an embedded map view, configure `react-native-maps` per the official docs — some platforms require extra native configuration or a development client.

Environment variables:

- Add a Google Maps API key for Geocoding/Directions by setting `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in your `.env` or EAS environment config.
- This project expects the key to be present; services will throw a clear error if the key is missing. Do not commit the key to source control.
