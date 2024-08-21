import { View, Text, StyleSheet, Image, Button } from 'react-native';
import { useQuery } from "@tanstack/react-query";

// @ts-ignore
function Movie({ movie }) {
    async function fetchMoviePlot(context: { queryKey: any[]; }) {
        const id = context.queryKey[1];
        const detailedResponse = await fetch('https://www.omdbapi.com/?apikey=89d3cf2f&i=' + id);
        let data = await detailedResponse.json();
        return data.Plot;
    }

    const moviePlotQuery = useQuery({
        queryKey: ['moviePlot', movie.imdbID],
        queryFn: fetchMoviePlot
    });

    return (
        <View style={styles.container}>
            <Image
                style={styles.poster}
                source={{ uri: movie.Poster }}
                resizeMode="cover"
            />
            <Text style={styles.title}>{movie.Title}</Text>
            <Text style={styles.plot}>{moviePlotQuery.data}</Text>
            <Button
                title="🤍"
                //onPress={}
                color="#BF6900"
            />
        </View>
    );
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
