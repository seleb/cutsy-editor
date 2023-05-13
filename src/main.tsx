import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { ContextSettings } from './ContextSettings';
import './main.scss';
import { ViewDebug } from './ViewDebug';
import { ViewEdit } from './ViewEdit';
import { ViewError } from './ViewError';
import { ViewIndex } from './ViewIndex';
import { ViewRoot } from './ViewRoot';
import { ViewSettings } from './ViewSettings';
import { ViewVideos } from './ViewVideos';

const router = createBrowserRouter(
	createRoutesFromElements(
		<Route element={<ViewRoot />} errorElement={<ViewError />}>
			<Route index element={<ViewIndex />} errorElement={<ViewError />} />
			<Route path="edit" element={<ViewEdit />} errorElement={<ViewError />} />
			<Route path="videos/:page?" element={<ViewVideos />} errorElement={<ViewError />} />
			<Route path="settings" element={<ViewSettings />} errorElement={<ViewError />} />
			<Route path="debug" element={<ViewDebug />} errorElement={<ViewError />} />
		</Route>
	)
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ContextSettings>
			<RouterProvider router={router} />
		</ContextSettings>
	</React.StrictMode>
);
