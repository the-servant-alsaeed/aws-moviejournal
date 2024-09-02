import React from 'react';
import {QueryClient, QueryClientProvider, useMutation, useQuery} from '@tanstack/react-query';
import Movie from './Movie';
import {ActivityIndicator, Button, SafeAreaView, ScrollView, StyleSheet, Text, View,} from 'react-native';
import {Amplify} from 'aws-amplify';
import {Authenticator, useAuthenticator} from "@aws-amplify/ui-react-native";
import {NavigationContainer} from "@react-navigation/native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { fetchAuthSession } from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_rl8GGnvBu',
      userPoolClientId: "7m6muvuc8p31lqapa3u53mj49v",
      identityPoolId: "us-east-1:b15c8568-7813-4ffc-9121-4e8f54587a22",
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code",
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
});

interface Movie{
  Title: string;
  imdbID: string;
  Poster: string;
}

//SIGN OUT BUTTON
const SignOutButton = () => {
  const { signOut } = useAuthenticator();

  return (
    <View style={styles.signOutButton}>
      <Button title="Sign Out" onPress={signOut} color ="#BF6900"/>
    </View>
  );
};

//FETCHING MOVIES USING REACT-QUERY AND GETMOVIES API FROM API GATEWAY IN SERVERLESS BACKEND
const queryClient = new QueryClient();

async function fetchMovies(){
  const response = await fetch('https://nyg9rmjaw4.execute-api.us-east-1.amazonaws.com/dev/v1/movies');
  return response.json();
}

//FETCHING FAVORITES USING REACT-QUERY AND GETFAVORITES API FROM API GATEWAY IN SERVERLESS BACKEND
async function fetchFavorites(){
  const { accessToken, idToken } = (await fetchAuthSession()).tokens ?? {};

  const response = await fetch('https://nyg9rmjaw4.execute-api.us-east-1.amazonaws.com/dev/v1/favorites',
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
    return response.json();
}

function AppContent(): React.JSX.Element {

  const movieQuery = useQuery({
    queryKey: ['movies'],
    queryFn: fetchMovies,
  });

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
  });

  //REMOVE FAVORITES FUNCTION
  async function removeFavorite(movie) {
    try {
      const { accessToken, idToken } = (await fetchAuthSession()).tokens ?? {};

      const response = await fetch(`https://nyg9rmjaw4.execute-api.us-east-1.amazonaws.com/dev/v1/movies/${movie.movieID}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
          });
      console.log(JSON.stringify(movie));

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Favorite removed:', result);
      return result;
    } catch (error) {
      console.error('Error in favoriteMovie:', error);
      throw error;
    }
  }

  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
  });

  //LOADING STATE
  if (movieQuery.isLoading) {
    return <View style={styles.container}>
      <Text style={styles.Loading}>Loading...</Text>
      <ActivityIndicator
        color='#2C5E1A'
        size='large'
      />
    </View>;
  }
  //ERROR STATE
  if (movieQuery.isError) {
    console.error('Query error:', movieQuery.error);
    return <View style={styles.container}><Text>Error: {movieQuery.error.message}</Text></View>;
  }

  //HOME SCREEN
  function HomeScreen(){
    return(
        <SafeAreaView style={styles.container}>
          <Text style={styles.headerTitle}>The Movie Journal🎬</Text>
          <ScrollView contentContainerStyle={styles.moviesList}>
            {movieQuery.data.map(function(movie) {
              return <Movie key={movie.movieID} movie={movie} />;
            })}
            <SignOutButton />
          </ScrollView>
        </SafeAreaView>
    );
  }

  //FAVORITES TAB
  function FavoritesScreen(){
      return(
          <SafeAreaView style={styles.container}>
          <Text style={styles.headerTitle}>Favorites🤍</Text>
          <ScrollView contentContainerStyle={styles.moviesList}>
            {favoritesQuery.data.map(function(movie) {
                return <Movie key={movie.movieID} movie={movie} queryClient={queryClient}/>;
            })}
          <Button
              title="💔"
              onPress={() => removeFavoriteMutation.mutate(movie)}
              color="#000000"
          />
              <SignOutButton />
          </ScrollView>
          </SafeAreaView>
      );
  }

  const Tab = createBottomTabNavigator();

  return (
    <Authenticator.Provider>
      <Authenticator>
        <NavigationContainer>
            <Tab.Navigator screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Favorites') {
                  iconName = focused ? 'heart' : 'heart-outline';
                }

                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#BF6900',
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                backgroundColor: '#FFFFED',
                borderTopWidth: 1,
                borderTopColor: '#eee',
              },
              headerShown: false,
            })}>
                <Tab.Screen name="Home" component={HomeScreen}/>
                <Tab.Screen name="Favorites" component={FavoritesScreen}/>
            </Tab.Navigator>
        </NavigationContainer>
      </Authenticator>
    </Authenticator.Provider>
  );
}

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFED',
  },
  Loading: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#BF6900',
    padding: 25,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#BF6900',
    padding: 25,
    textAlign: 'center',
  },
  header: {
    height: 100,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFED',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  moviesList: {
    padding: 10,
  },
  signOutButton: {
    alignSelf: 'center',
    padding: 10,
    marginBottom: 10,
  },
});

export default App;
