import React, { useState, useEffect } from 'react';
import axios from 'axios'


import './Article.css'
import { Link, useParams } from 'react-router-dom'

const GamesPage = (props) => 
{
	const [data, setData] = useState([])
	const id = useParams().id;
  	useEffect(() => {
		axios.get(`http://localhost:3000/games/${id}`)
		.then((response) => {
			setData(response.data)
		})
		.catch((err) => {
			console.error(err)
		})
  	}, [id])


	return (
		<div>
			<h1>{data.title}</h1>
			<section className="game-header">
				<article key={data.id}>
				<div className= "game-description">
					<p>{data.description}</p>
					<button className = "button-search">Play</button>
				</div>
				</article>
			</section>
			<Link to={`/comments`}>
			<h2>Comments</h2>
			</Link>
		</div>
	);
}

// <ArticleCard a_user = "Dancuz4189" a_name = "How To Create a 2D Platformer" a_tags = {["Mechanics", "Physics" , "Mathematics","\0"]} a_desc = "hello" />
export default GamesPage;
