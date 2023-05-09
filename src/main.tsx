import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import './main.scss';
import { ViewAbout } from './ViewAbout';
import { ViewDebug } from './ViewDebug';
import { ViewError } from './ViewError';
import { ViewIndex } from './ViewIndex';
import { ViewRoot } from './ViewRoot';
import { ViewVideos } from './ViewVideos';

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<ViewRoot />} errorElement={<ViewError />}>
			<Route index element={<ViewIndex />} errorElement={<ViewError />} />
			<Route path="debug" element={<ViewDebug />} errorElement={<ViewError />} />
		</Route>
	)
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);
