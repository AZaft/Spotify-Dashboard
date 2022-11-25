from turtle import distance
from urllib import request
from flask import Flask, request
import pandas as p
from flask_cors import CORS
from sklearn.manifold import MDS
from sklearn.metrics.pairwise import euclidean_distances
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

import json

spotifydf = p.read_csv('../spotifiy2010-2021.csv')

app = Flask(__name__)

CORS(app)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/lab5/parallelaxis")
def parallel_axis():
    data_correlation = get_correlations()
    data_correlation_sum = data_correlation.sum().sort_values(ascending=False)

    strongest = data_correlation_sum.index[0]
    strongest2 = data_correlation_sum.index[1]

    #attribute with highest correlation to strongest2 avoiding repeats
    axis3 = data_correlation[strongest2].sort_values(ascending=False).index[1]

    #attribute with highest correlation to axis3 avoiding repeats
    axis4 = data_correlation[axis3].sort_values(ascending=False).index[3]

    axis = [strongest, strongest2, axis3, axis4]

    print(axis)
    return axis



@app.route("/lab5/pca")
def pca():
    args = request.args
    #standardizing data

    data = spotifydf[[ 'BPM', 'Energy', 'Danceability', 'Loudness', 'Liveness', 'Valence', 'Duration', 'Acousticness']]
    standard_spotifydf = StandardScaler().fit_transform(data)
    print(standard_spotifydf)

    pca = PCA(n_components=8)
    principal_components = pca.fit_transform(standard_spotifydf)
    principal_df = p.DataFrame(data = principal_components, columns = ['pc1', 'pc2', 'pc3', 'pc4', 'pc5', 'pc6', 'pc7', 'pc8'])

    eigenvalues = pca.explained_variance_
    egivenvalues_ratio = pca.explained_variance_ratio_
    print(principal_df)
    print(eigenvalues)
    print(egivenvalues_ratio)

    if(args.get("type") == "eigenvalues"):
        return eigenvalues.tolist()
    elif(args.get("type") == "eigenvectors"):
        return pca.components_.tolist()
    else:
        return principal_df.to_json()


@app.route("/lab5/histogramdata")
def histogram():
    args = request.args
   
    data = spotifydf[[ args.get("var")]]
    
    return data.to_dict()

@app.route("/lab5/genre-frequency")
def data():
    args = request.args
    data = spotifydf.loc[spotifydf['Year'] == int(args.get("year"))][['Genre']].value_counts()


    print(data)
    return data.to_json()

def get_correlations():
     #filter by year 
     # spotifydf.loc[ spotifydf['Year'] == 2012 ]
     #filter by attributes
    data = spotifydf[[ 'BPM', 'Energy', 'Danceability', 'Loudness', 'Liveness', 'Valence', 'Duration', 'Acousticness']]
    return data.corr()