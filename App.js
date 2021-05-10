import * as React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Text, View, Image} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import BeaconScreen from './BeaconScreen';
import ScanScreen from './ScanScreen';

function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgb(0,0,0)',
      }}>
      <Image
        style={{
          width: '100%',
          height: 200,
        }}
        source={require('./a.jpeg')}
      />
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'md-home';
            } else if (route.name === 'QR Code') {
              iconName = 'md-qr-scanner';
            }
            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}>
        <Tab.Screen name="Home" component={BeaconScreen} />
        <Tab.Screen name="QR Code" component={ScanScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
