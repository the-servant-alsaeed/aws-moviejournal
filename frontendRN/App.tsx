import React from 'react';
import {useQuery, QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Movie from './Movie';
import {
  SafeAreaView,
  Button,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Amplify } from 'aws-amplify';
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
// import {
//   Colors,
//   DebugInstructions,
//   Header,
//   LearnMoreLinks,
//   ReloadInstructions,
// } from 'react-native/Libraries/NewAppScreen';

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

const SignOutButton = () => {
  const { signOut } = useAuthenticator();

  return (
    <View style={styles.signOutButton}>
      <Button title="Sign Out" onPress={signOut} color ="#BF6900"/>
    </View>
  );
};

const queryClient = new QueryClient();

async function fetchMovies(){
  const response = await fetch("https://www.omdbapi.com/?apikey=89d3cf2f&s=Harry+Potter");
  let data = await response.json();
  return data.Search.map((movie: Movie) => ({...movie, isFavorite: false}));
}

function AppContent(): React.JSX.Element {

  const movieQuery = useQuery({
    queryKey: ['movies'],
    queryFn: fetchMovies,
  });

  if (movieQuery.isLoading) {
    return <View style={styles.container}>
      <Text style={styles.Loading}>Loading...</Text>
      <ActivityIndicator
        color='#2C5E1A'
        size='large'
      />
    </View>;
  }

  if (movieQuery.isError) {
    console.error('Query error:', movieQuery.error);
    return <View style={styles.container}><Text>Error: {movieQuery.error.message}</Text></View>;
  }


  return (
    <Authenticator.Provider>
      <Authenticator>
        <SafeAreaView style={styles.container}>
          <Text style={styles.headerTitle}>The (React-Native) Movie Journal🎬</Text>
          <ScrollView contentContainerStyle={styles.moviesList}>
            {movieQuery.data.map(function(movie) {
              return <Movie key={movie.imdbID} movie={movie} />;
            })}
            <SignOutButton />
          </ScrollView>
        </SafeAreaView>
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
