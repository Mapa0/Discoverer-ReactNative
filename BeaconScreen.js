/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
import React, {Component} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeEventEmitter,
  Platform,
  StyleSheet,
  Text,
  View,
  AppState,
} from 'react-native';
import {ListItem} from 'react-native-elements';
import NearBee from './nearbee_sdk/NearBee';
import {
  PERMISSIONS,
  request as PermissionRequest,
  requestMultiple as PermissionRequests,
  checkMultiple as PermissionChecks,
  RESULTS as PermissionResult,
} from 'react-native-permissions';

const eventBeacons = 'nearBeeNotifications';
const eventError = 'nearBeeError';

export default class BeaconScreen extends Component {
  constructor() {
    super();
    this.bgEnabled = false;
    this.scanning = false;

    this.state = {
      bgButtonText: 'Enable BG notification',
      scanText: 'Start scanning',
      beaconString: 'No beacons in range',
      beacons: [],
      loading: true,
      locationPermission: false,
      bluetoothPermission: false,
      noBeaconError: false,
      scanStartTime: null,
    };
  }

  componentDidMount() {
    this.checkPermissions();
    AppState.addEventListener('change', this._handleAppStateChange);
    if(!this.state.bluetoothPermission){
      this.requestBluetoothPermission();
    }
    if(!this.state.locationPermission){
      this.requestLocationPermission();
    }
  }

  componentWillUnmount() {
    this.stopScan();
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState) => {
    console.log('-------- appState: ', nextAppState);
    if (nextAppState.match(/inactive|background/)) {
      this.stopScan();
    } else {
      this.startScan();
    }
  };

  onBackgroundChange = () => {
    if (this.bgEnabled === true) {
      this.setState({
        bgButtonText: 'Enable BG notification',
      });
    } else {
      this.setState({
        bgButtonText: 'Disable BG notification',
      });
    }
    this.bgEnabled = !this.bgEnabled;
    NearBee.enableBackgroundNotifications(this.bgEnabled);
  };

  onBeaconsFound = (event) => {
    let beacons = [];
    let beacJson = JSON.parse(event.nearBeeNotifications);
    // console.warn('beacon count: ', beacJson.nearBeeNotifications.length);
    for (let index = 0; index < beacJson.nearBeeNotifications.length; index++) {
      const element = beacJson.nearBeeNotifications[index];
      element['key'] = element.url;
      beacons.push(element);
    }
    this.setState({beacons});
    if (beacons.length > 0) {
      this.setState({
        noBeaconError: false,
        loading: false,
        scanStartTime: new Date().getTime(),
      });
    } else {
      if (new Date().getTime() - this.state.scanStartTime > 3000) {
        this.setState({
          noBeaconError: true,
          loading: true,
        });
      }
    }
  };

  onError = (event) => {
    let error = event.nearBeeError;
    console.error(error);
  };

  initNearBee() {
    if (!this.state.locationPermission) {
      return;
    }
    NearBee.initialize();
    // NearBee.enableDebugMode(true);
    NearBee.enableBackgroundNotifications(true);
    const eventEmitter = new NativeEventEmitter(NearBee);
    eventEmitter.addListener(eventBeacons, this.onBeaconsFound);
    eventEmitter.addListener(eventError, this.onError);
    this.startScan();
    NearBee.startGeoFenceMonitoring();
  }

  async requestLocationPermission() {
    PermissionRequests(
      Platform.select({
        android: [
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
        ],
        ios: [
          PERMISSIONS.IOS.LOCATION_ALWAYS,
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        ],
      }),
    ).then((response) => {
      // Returns once the user has chosen to 'allow' or to 'not allow' access
      // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
      if (Platform.OS === 'ios') {
        if (
          response[PERMISSIONS.IOS.LOCATION_ALWAYS] ===
            PermissionResult.GRANTED ||
          response[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] ===
            PermissionResult.GRANTED
        ) {
          this.checkPermissions();
        }
      } else {
        if (
          response[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] ===
            PermissionResult.GRANTED ||
          response[PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION] ===
            PermissionResult.GRANTED
        ) {
          this.checkPermissions();
        }
      }
    });
  }

  async requestBluetoothPermission() {
    PermissionRequest(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL).then((response) => {
      // Returns once the user has chosen to 'allow' or to 'not allow' access
      // Response is one of: 'authorized', 'denied', 'restricted', or 'undetermined'
      if (response === PermissionResult.GRANTED) {
        this.checkPermissions();
      }
    });
  }

  async checkPermissions() {
    PermissionChecks(
      Platform.select({
        android: [
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
          PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
        ],
        ios: [
          PERMISSIONS.IOS.LOCATION_ALWAYS,
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
          PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL,
        ],
      }),
    ).then((response) => {
      //response is an object mapping type to permission
      if (Platform.OS === 'ios') {
        console.log(response[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]);
        if (
          response[PERMISSIONS.IOS.LOCATION_ALWAYS] ===
            PermissionResult.GRANTED ||
          response[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] ===
            PermissionResult.GRANTED
        ) {
          this.setState({
            locationPermission: true,
          });
        }
        if (
          response[PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL] ===
          PermissionResult.GRANTED
        ) {
          this.setState({
            bluetoothPermission: true,
          });
        }
      } else {
        // Bluetooth permission is only required for iOS
        if (
          response[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] ===
            PermissionResult.GRANTED ||
          response[PERMISSIONS.IOS.LOCATION_ALWAYS] ===
            PermissionResult.GRANTED ||
          response[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE] ===
            PermissionResult.GRANTED
        ) {
          this.setState({
            locationPermission: true,
            bluetoothPermission: true,
          });
        }
      }

      // Checking all the states
      if (!this.state.bluetoothPermission) {
        this.requestBluetoothPermission();
      } else if (!this.state.locationPermission) {
        this.requestLocationPermission();
      } else {
        this.initNearBee();
      }
    });
  }

  startScan() {
    NearBee.startScanning();
    this.scanning = true;
    this.setState({
      scanStartTime: new Date().getTime(),
    });
  }

  stopScan() {
    NearBee.stopScanning();
    this.scanning = false;
  }

  launchUrl(url) {
    NearBee.launchUrl(url);
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: '#ffffff'}}>
        {this.state.loading ? (
          <View style={[styles.flexJustifyCenter, styles.alignItemsCenter]}>
            <Image
              resizeMode="contain"
              source={require('./no_beacon_error.png')}
              style={{height: '70%', width: '70%'}}
            />
            {this.state.noBeaconError ? (
              <View style={styles.alignItemsCenter}>
                <Text style={styles.noBeaconMessageTitle}>
                  Sem beacons por perto
                </Text>
                <Text style={styles.loadingMessageSubtitle}>
                  Links e ofertas aparecer??o ao detectar um beacon
                </Text>
              </View>
            ) : (
              <View style={styles.alignItemsCenter}>
                <Text style={styles.loadingMessageTitle}>
                  Buscando beacons pr??ximos
                </Text>
                <Text style={styles.loadingMessageSubtitle}>
                  Links e ofertas aparecer??o ao detectar um beacon
                </Text>
              </View>
            )}
            <ActivityIndicator
              style={{marginTop: 20}}
              size="small"
              color="#0000ff"
            />
          </View>
        ) : (
          <View>
            <FlatList
              data={this.state.beacons}
              renderItem={({item}) => (
                <ListItem
                  title={item.title}
                  subtitle={item.description}
                  hideChevron
                  onPress={() => {
                    this.launchUrl(item.url);
                  }}
                  leftIcon={
                    <Image
                      source={{uri: item.icon}}
                      style={{height: 60, width: 60}}
                    />
                  }
                />
              )}
            />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 20,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  itemBlock: {
    flexDirection: 'row',
    paddingBottom: 5,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  itemMeta: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 20,
  },
  itemLastMessage: {
    fontSize: 14,
    color: '#111',
  },
  flexJustifyCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  alignItemsCenter: {
    alignItems: 'center',
  },
  loadingMessageTitle: {
    fontSize: 16,
    color: '#FBAA19',
  },
  noBeaconMessageTitle: {
    fontSize: 16,
    color: 'red',
  },
  loadingMessageSubtitle: {
    fontSize: 12,
  },
});
