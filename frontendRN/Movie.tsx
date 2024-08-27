import { View, Text, StyleSheet, Image, Button } from 'react-native';
import {useMutation} from "@tanstack/react-query";
import { fetchAuthSession } from 'aws-amplify/auth';

// @ts-ignore
function Movie({ movie, queryClient }) {

    async function favoriteMovie(movie) {
        try {
            const { accessToken, idToken } = (await fetchAuthSession()).tokens ?? {};

            const response = await fetch('https://nyg9rmjaw4.execute-api.us-east-1.amazonaws.com/dev/v1/movies',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(movie),
            });
            console.log(JSON.stringify(movie));

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Favorite added:', result);
            return result;
        } catch (error) {
            console.error('Error in favoriteMovie:', error);
            throw error;
        }
    }

    const favoriteMovieMutation = useMutation({
        mutationFn: favoriteMovie,
        onSuccess: () => {
            queryClient.invalidateQueries(['favorites']);
        },
    });

    return <View style={styles.container}>
        <Image
            style={styles.poster}
            source={{ uri: movie.posterURL }}
            resizeMode="cover"
        />
        <Text style={styles.title}>{movie.movieTitle}</Text>
        <Text style={styles.plot}>{movie.plot}</Text>
        <Button
            title="🤍"
            onPress={() => favoriteMovieMutation.mutate(movie)}
            color="#BF6900"
        />
    </View>;
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#2C5E1A',
        borderRadius: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: 'white',
        textAlign: 'center',
    },
    plot: {
        fontSize: 14,
        color: 'white',
        marginBottom: 16,
    },
    poster: {
        width: 100,
        height: 150,
        alignSelf: 'center',
        marginBottom: 16,
    },
});

export default Movie;
