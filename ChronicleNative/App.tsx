import { StatusBar } from 'expo-status-bar';
import { MainScreen } from './src/screens/MainScreen';

export default function App() {
  return (
    <>
      <MainScreen />
      <StatusBar style="auto" />
    </>
  );
}