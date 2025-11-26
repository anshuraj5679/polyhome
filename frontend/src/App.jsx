import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateListing from './pages/CreateListing';
import ListingDetails from './pages/ListingDetails';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateListing />} />
            <Route path="/listing/:id" element={<ListingDetails />} />
        </Routes>
    );
}

export default App;
