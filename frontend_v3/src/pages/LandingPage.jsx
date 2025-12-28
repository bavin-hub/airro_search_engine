import { FaSearch } from "react-icons/fa";
import { useState, useEffect, useRef } from 'react';
import DocsResult from './DocsResult';
import Switch from '@mui/material/Switch'


function LandingPage() {

    const [isChecked, setChecked] = useState(false)

    // ai page vars starts here
    const [chatType, setChatType] = useState('chat')
    const [is_generating, setIsGenerating] = useState(false)

    
    function switchChat(chat_type){
        setChatType(chat_type)
    }

    function handleToggle(){
        setChecked(!isChecked)
    }

    const [dummy_chat, setDummyChat] = useState([])
    const [code_chat, setCodeChat] = useState([])

    const chat_len = useRef()
    const current_chat = useRef()

    const code_chat_len = useRef()
    const current_code_chat = useRef()


    const [query, setQuery] = useState('')
    const [search_query_stored, setSearchQueryStored] = useState('')

    const [searchResults, updateSearchResults] = useState(() => {
        const cached_results = sessionStorage.getItem('cached_search_results')
        return cached_results ? JSON.parse(cached_results) : {}
    })

    const [display_results_type, setDisplayResultsType] = useState(() => {
        const cached_last_page = sessionStorage.getItem('last_page')
        return cached_last_page ? cached_last_page : 'doc_results' 
    })
    // let display_results_type = 'doc_results'
    let content;


    useEffect(() => {
        chat_len.current = dummy_chat.length
    }, [dummy_chat.length])

    useEffect(() => {
        current_chat.current = dummy_chat
    }, [dummy_chat])


    useEffect(() => {
        code_chat_len.current = code_chat.length
    }, [code_chat.length])

    useEffect(() => {
        current_code_chat.current = code_chat
    }, [code_chat])


    useEffect(() => {
        console.log('establishing')
        // Create a new EventSource instance, pointing to the Flask SSE endpoint
        const eventSource = new EventSource('http://localhost:5080/ai_content_stream');
    
        eventSource.onopen = () => {
        console.log("SSE connection opened");
        };
    
        // Define the message handler
        eventSource.onmessage = (event) => {
        //   console.log("Received message:", JSON.parse(event.data).content);
            
            const data = JSON.parse(event.data)
            if (data.content === 'opened') return

            if (data.content === 'generation_completed')
            {
                setIsGenerating(false)
                return
            }

            if(data.interaction_type == 'chat'){
                const idx = chat_len.current % 2
                const id = Math.floor(chat_len.current / 2) + 1
                const turn = data.system_response_id
                console.log(data.content)
                setDummyChat(prevChat => {
                    const existingIndex = prevChat.findIndex(
                        chat => chat.turn === turn
                    )

                    if(existingIndex !== -1){
                        const updatedChat = [...prevChat]
                        updatedChat[existingIndex] ={
                            ...updatedChat[existingIndex],
                            res: updatedChat[existingIndex].res + data.content
                        }
                        return updatedChat
                    }

                    return [
                        ...prevChat,
                        {turn, res: data.content}
                    ]
                })
            }
            else{
                const idx = code_chat_len.current % 2
                const id = Math.floor(code_chat_len.current / 2) + 1
                const turn = data.system_response_id
                setCodeChat(prevChat => {
                    // console.log(prevChat)
                    const existingIndex = prevChat.findIndex(
                        chat => chat.turn === turn
                    )

                    if(existingIndex !== -1){
                        const updatedChat = [...prevChat]
                        updatedChat[existingIndex] ={
                            ...updatedChat[existingIndex],
                            res: updatedChat[existingIndex].res + data.content
                        }
                        return updatedChat
                    }

                    return [
                        ...prevChat,
                        {turn, res: data.content}
                    ]
                })
            }
            
        };
    
        // Optional: Define a handler for errors or connection issues
        eventSource.onerror = (error) => {
          console.error("EventSource failed:", error);
          eventSource.close(); // Close the connection on error
        };
    
        // The EventSource API includes automatic reconnection logic
    
        // Cleanup function to close the connection when the component unmounts
        return () => {
          eventSource.close();
        };
      }, []);




    function handleKeyDown(event){
        // console.log(event.key)
        if(event.key == 'Enter')
        {
            handleSearch()
        }
    }
    
    function clearInteraction(chat_type){
        if(chat_type == 'chat'){
            setDummyChat([])
        }
        else{
            setCodeChat([])
        }
    }

    function updateSearchQuery(event){
        setQuery(event.target.value)
    }

    function handleSearch(init_query=''){

        //  if in doc page (by default) get both doc results and ai results
        if(display_results_type == 'doc_results'){
            setSearchQueryStored(query)
            // make ai rag search api call
            async function send_ai_request(){
                
                const verify = await fetch("http://localhost:5080/ai_rag_search", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ai_query: query
                                        })
                })

                const status = await verify.json()

            }

            // send_ai_request()

            
            // make normal search api call
            async function send_search_request(){
                const verify = await fetch("http://localhost:5000/text_search_query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ search_query: query
                                        })
                })

                const search_results = await verify.json()
                
                // cache the search results to the session storage
                sessionStorage.setItem('cached_search_results', JSON.stringify(search_results))
                
                updateSearchResults(search_results)
            }

            send_search_request()

        }
        else{

            if(is_generating == true){
                console.log('generation is in progress. cannot take request now')
            }
            else{
                console.log('handles only ai request')
                console.log(init_query)
                console.log()
                console.log('above are the queries')

                let user_query = ''
                if (init_query == ''){
                    user_query = {'turn': 'user', 'res':query}
                }
                else{
                    user_query = {'turn': 'user', 'res':init_query}
                }

                console.log(user_query)

                user_query = {'turn': 'user', 'res':query}
                let system_response_id = ''
                console.log('below is the system response id')
                if(chatType == 'chat'){
                    setDummyChat([...dummy_chat, user_query])
                    system_response_id = Object.keys(dummy_chat)
                    if(dummy_chat.length == 0){
                        system_response_id = 'system_response_1'
                    }
                    else{
                        const my_id = Math.floor(chat_len.current / 2) + 1
                        system_response_id = 'system_response_' + my_id 

                    }
                    console.log(system_response_id)
                }
                else{
                    setCodeChat([...code_chat, user_query])
                    system_response_id = Object.keys(code_chat)
                    if(dummy_chat.length == 0){
                        system_response_id = 'system_response_1'
                    }
                    else{
                        const my_id = Math.floor(chat_len.current / 2) + 1
                        system_response_id = 'system_response_' + my_id 

                    }
                }
                
                // document.getElementById('specificInput').value = ''

                // make ai rag search api call
                async function send_ai_request(){
                    
                    console.log(current_chat)
                    if(chatType == 'code'){
                        const verify = await fetch("http://localhost:5080/ai_rag_search", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ai_query: query,
                                            interaction_type: chatType,
                                            system_response_id: system_response_id,
                                            context: current_code_chat,
                                            is_rag: isChecked
                                            })
                        })
                        const status = await verify.json()
                    }
                    else{
                        const verify = await fetch("http://localhost:5080/ai_rag_search", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ai_query: query,
                                            interaction_type: chatType,
                                            system_response_id: system_response_id,
                                            context: current_chat,
                                            is_rag: isChecked
                                            })
                        })
                        const status = await verify.json()
                    }
                    
                    setIsGenerating(true)

                }

                send_ai_request()

            }
            
        }
        

    }

    

    function changeDisplayResultsType(display_results_type){
        sessionStorage.setItem('last_page', display_results_type)
        setDisplayResultsType(display_results_type)
    }

    if(Object.keys(searchResults).length > 0){
        if(searchResults.status == 'found'){

        if(display_results_type == 'doc_results'){
            content = (
    <>
        {/* Top Right Controls */}
        <div className="absolute top-0 right-0 flex flex-wrap gap-2 p-3 sm:p-4 text-white font-mono font-bold italic text-sm sm:text-xl">
            {display_results_type == 'doc_results' ?
                <>
                    <p className='bg-blue-700 px-3 py-1 sm:p-2 rounded-md'>Docs</p>
                    <p
                        onClick={() => changeDisplayResultsType('ai_results')}
                        className='bg-blue-400 px-3 py-1 sm:p-2 rounded-md cursor-pointer hover:scale-105'
                    >
                        AI Mode
                    </p>
                </>
                :
                <>
                    <p
                        onClick={() => changeDisplayResultsType('doc_results')}
                        className='bg-blue-400 px-3 py-1 sm:p-2 rounded-md cursor-pointer hover:scale-105'
                    >
                        Docs
                    </p>
                    <p className='bg-blue-700 px-3 py-1 sm:p-2 rounded-md'>AI Mode</p>
                </>
            }

            <p className='bg-green-100 text-black px-3 py-1 sm:p-2 rounded-md flex items-center gap-1'>
                RAG <Switch checked={isChecked} onChange={handleToggle} />
            </p>
        </div>

        {/* Logo */}
        <div className="absolute top-0 left-0 bg-blue-400 m-3 sm:m-5 px-4 py-2 rounded-md hover:scale-110 cursor-pointer">
            <p className="text-white text-lg sm:text-xl font-bold font-mono">AiRRo</p>
        </div>

        {/* Hero Section */}
        <div className='flex flex-col items-center justify-center mt-28 sm:mt-20 px-4'>
            <p className='text-white text-4xl sm:text-6xl italic font-bold font-mono text-center'>
                __Entity__
            </p>

            <p className='text-white text-base sm:text-xl italic font-mono mt-4 sm:mt-5 text-center'>
                "Providing swift, consistent, and transparent outcomes."
            </p>

            {/* Search Bar */}
            <div className='flex items-center bg-white mt-8 sm:mt-10 rounded-md w-full max-w-4xl'>
                <FaSearch className='ml-3 text-lg sm:text-xl' />
                <input
                    value={query}
                    onKeyDown={(e) => handleKeyDown(e)}
                    onChange={(e) => updateSearchQuery(e)}
                    className='h-14 sm:h-16 flex-1 pl-4 outline-none text-base sm:text-xl'
                    type='text'
                    placeholder='Search for anything'
                />
                <div
                    onClick={handleSearch}
                    className='bg-blue-400 px-4 sm:px-6 h-10 sm:h-12 m-2 hover:scale-105 cursor-pointer rounded-md flex items-center'
                >
                    <h2 className='text-white text-base sm:text-2xl font-bold font-mono italic'>
                        Search
                    </h2>
                </div>
            </div>
        </div>

        {/* Search Meta */}
        <div className='flex flex-col sm:flex-row justify-center gap-2 sm:gap-10 mt-5 px-4 font-bold font-mono italic text-base sm:text-lg text-center'>
            <p className='text-white'>
                Search Time : {searchResults.search_time}
            </p>
            <p className='text-white'>
                Found {searchResults.found} relevant docs
            </p>
        </div>

        {/* Results */}
        <DocsResult searchResults={searchResults} />
    </>
)

        }
        else{

            if(dummy_chat.length == 0 && search_query_stored != '')
            {
                console.log('we have to init the ai request')
                // console.log(search_query_stored)
                // console.log(query)
                handleSearch(search_query_stored)
            }
            content = (
    <>
        {/* Top Right Controls */}
        <div className="absolute top-0 right-0 flex flex-wrap gap-2 p-3 sm:p-4 text-white font-mono font-bold italic text-sm sm:text-xl">
            {display_results_type == 'doc_results' ?
                <>
                    <p className='bg-blue-700 px-3 py-1 sm:p-2 rounded-md'>Docs</p>
                    <p
                        onClick={() => changeDisplayResultsType('ai_results')}
                        className='bg-blue-400 px-3 py-1 sm:p-2 rounded-md cursor-pointer hover:scale-105'
                    >
                        AI Mode
                    </p>
                </>
                :
                <>
                    <p
                        onClick={() => changeDisplayResultsType('doc_results')}
                        className='bg-blue-400 px-3 py-1 sm:p-2 rounded-md cursor-pointer hover:scale-105'
                    >
                        Docs
                    </p>
                    <p className='bg-blue-700 px-3 py-1 sm:p-2 rounded-md'>AI Mode</p>
                </>
            }

            <p className='bg-green-100 text-black px-3 py-1 sm:p-2 rounded-md flex items-center gap-1'>
                RAG <Switch checked={isChecked} onChange={handleToggle} />
            </p>
        </div>

        {/* Logo */}
        <div className="absolute top-0 left-0 bg-blue-400 m-3 sm:m-5 px-4 py-2 rounded-md hover:scale-110 cursor-pointer">
            <p className="text-white text-lg sm:text-xl font-bold font-mono">AiRRo</p>
        </div>

        {/* Header */}
        <div className='flex flex-col items-center justify-center mt-24 sm:mt-15 px-4'>
            <p className='text-white text-4xl sm:text-6xl italic font-bold font-mono text-center'>
                __Entity__
            </p>
            <p className='text-white text-base sm:text-xl italic font-mono mt-4 sm:mt-5 text-center'>
                "Providing swift, consistent, and transparent outcomes."
            </p>
        </div>

        {/* Results Switch */}
        {/* <div className='flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-10 mt-5 px-4 font-bold font-mono text-white text-lg sm:text-2xl'>
            <p>Search Results :</p>
            <h2
                onClick={() => changeDisplayResultsType('doc_results')}
                className='hover:scale-105 cursor-pointer hover:text-blue-200'
            >
                Docs
            </h2>
            <h2 className='underline decoration-blue-400 decoration-4'>
                AI
            </h2>
        </div> */}

        {/* Chat Area */}
        {chatType == 'chat' ?
            dummy_chat.length > 0 ?
                dummy_chat.map((single_chat_object) => (
                    <div className='flex justify-center mt-10 px-4'>
                        {single_chat_object.turn.includes('user') ?
                            <div className='ml-auto lg:mr-[30%] bg-blue-200 rounded-md max-w-[90%] sm:max-w-2xl'>
                                <p className='font-bold font-mono p-2 text-base sm:text-xl'>
                                    {single_chat_object.res}
                                </p>
                            </div>
                            :
                            <div className='bg-blue-400 rounded-md max-w-full sm:max-w-3xl'>
                                <p className='font-bold font-mono p-2 text-base sm:text-xl text-white'>
                                    {single_chat_object.res}
                                </p>
                            </div>
                        }
                    </div>
                ))
                : <></>
            :
            code_chat.length > 0 ?
                code_chat.map((single_chat_object) => (
                    <div className='flex justify-center mt-10 px-4'>
                        {single_chat_object.turn.includes('user') ?
                            <div className='ml-auto bg-blue-200 rounded-md max-w-full sm:max-w-2xl'>
                                <p className='font-bold font-mono p-2 text-base sm:text-xl'>
                                    {single_chat_object.res}
                                </p>
                            </div>
                            :
                            <div className='bg-blue-400 rounded-md max-w-full sm:max-w-3xl'>
                                <p className='font-bold font-mono p-2 text-base sm:text-xl text-white'>
                                    {single_chat_object.res}
                                </p>
                            </div>
                        }
                    </div>
                ))
                : <></>
        }

        {/* Bottom Input */}
        <div className='flex flex-col justify-end w-full max-w-4xl mx-auto h-screen overflow-y-auto no-scrollbar pb-40 sm:pb-80 px-4'>
            <div className='flex items-center bg-white mt-6 sm:mt-10 rounded-md'>
                <FaSearch className='ml-3 text-lg sm:text-xl' />
                <input
                    onKeyDown={(e) => handleKeyDown(e)}
                    onChange={(e) => updateSearchQuery(e)}
                    className='h-14 sm:h-16 flex-1 pl-4 outline-none text-base sm:text-xl'
                    type='text'
                    placeholder='Search for anything'
                    id='specificInput'
                />
                <div
                    onClick={handleSearch}
                    className='bg-blue-400 px-6 h-10 sm:h-12 m-2 hover:scale-105 cursor-pointer rounded-md flex items-center'
                >
                    <h2 className='text-white text-base sm:text-2xl font-bold font-mono italic'>
                        Go
                    </h2>
                </div>
            </div>
        </div>
    </>
)


        }

        }
        else if(searchResults.status == 'not found'){
            content = (
    <>
        {/* Top Right Controls */}
        <div className="absolute top-0 right-0 flex flex-wrap gap-2 p-3 sm:p-4 text-white font-mono font-bold italic text-sm sm:text-xl">
            {display_results_type == 'doc_results' ?
                <>
                    <p className='bg-blue-700 px-3 py-1 sm:p-2 rounded-md'>Docs</p>
                    <p
                        onClick={() => changeDisplayResultsType('ai_results')}
                        className='bg-blue-400 px-3 py-1 sm:p-2 rounded-md cursor-pointer hover:scale-105'
                    >
                        AI Mode
                    </p>
                </>
                :
                <>
                    <p
                        onClick={() => changeDisplayResultsType('doc_results')}
                        className='bg-blue-400 px-3 py-1 sm:p-2 rounded-md cursor-pointer hover:scale-105'
                    >
                        Docs
                    </p>
                    <p className='bg-blue-700 px-3 py-1 sm:p-2 rounded-md'>AI Mode</p>
                </>
            }
            <p className='bg-green-100 text-black px-3 py-1 sm:p-2 rounded-md flex items-center gap-1'>
                RAG <Switch checked={isChecked} onChange={handleToggle} />
            </p>
        </div>

        {/* Logo */}
        <div className="absolute top-0 left-0 bg-blue-400 m-3 sm:m-5 px-4 py-2 rounded-md hover:scale-110 cursor-pointer">
            <p className="text-white text-lg sm:text-xl font-bold font-mono">AiRRo</p>
        </div>

        {/* Hero Section */}
        <div className='flex flex-col items-center justify-center mt-24 sm:mt-5 px-4 text-center'>
            <p className='text-white text-4xl sm:text-6xl italic font-bold font-mono'>
                __Entity__
            </p>

            <p className='text-white text-base sm:text-xl italic font-mono mt-4 sm:mt-5'>
                "Providing swift, consistent, and transparent outcomes."
            </p>

            {/* Search Bar */}
            <div className='flex items-center bg-white mt-8 sm:mt-10 rounded-md w-full max-w-4xl'>
                <FaSearch className='ml-3 text-lg sm:text-xl' />
                <input
                    onKeyDown={(e) => handleKeyDown(e)}
                    onChange={(e) => updateSearchQuery(e)}
                    className='h-14 sm:h-16 flex-1 pl-4 outline-none text-base sm:text-xl'
                    type='text'
                    placeholder='Search for anything'
                />
                <div
                    onClick={handleSearch}
                    className='bg-blue-400 px-4 sm:px-6 h-10 sm:h-12 m-2 hover:scale-105 cursor-pointer rounded-md flex items-center'
                >
                    <h2 className='text-white text-base sm:text-2xl font-bold font-mono italic'>
                        Search
                    </h2>
                </div>
            </div>
        </div>

        {/* Empty State Message */}
        <div className='flex justify-center px-4'>
            <p className='text-white text-xl sm:text-3xl italic font-mono mt-10 text-center'>
                Oops....Not able to find relevant docs!!!
            </p>
        </div>
    </>
)

        }
        else if(searchResults.status == 'server error'){
            content = (
    <>
        {/* Logo */}
        <div className='bg-blue-400 m-3 sm:m-5 px-4 py-2 rounded-md hover:scale-110 cursor-pointer w-fit'>
            <p className='text-white text-lg sm:text-xl font-bold font-mono'>AiRRo</p>
        </div>

        <div className='flex flex-col items-center justify-center mt-5 px-4'>
            {/* Header */}
            <p className='text-white text-4xl sm:text-6xl italic font-bold font-mono text-center'>
                __Entity__
            </p>

            <p className='text-white text-base sm:text-xl italic font-mono mt-4 sm:mt-5 text-center'>
                "Providing swift, consistent, and transparent outcomes."
            </p>

            {/* Chat Area */}
            {chatType == 'chat' ?
                dummy_chat.length > 0 ?
                    dummy_chat.map((single_chat_object) => (
                        <div className='flex justify-center mt-8 sm:mt-20 w-full max-w-5xl mx-auto'>
                            {
                                single_chat_object.turn.includes('user') ?
                                    <div className='ml-auto lg:mr-[10%] bg-blue-200 rounded-md max-w-[90%] sm:max-w-2xl'>
                                        <p className='font-bold font-mono p-2 text-base sm:text-xl'>
                                            {single_chat_object.res}
                                        </p>
                                    </div>
                                    :
                                    <div className='mr-auto lg:ml-[10%] bg-blue-400 rounded-md max-w-[90%] sm:max-w-3xl'>
                                        <p className='font-bold font-mono p-2 text-base sm:text-xl text-white'>
                                            {single_chat_object.res}
                                        </p>
                                    </div>
                            }
                        </div>
                    ))
                    : <></>
                :
                code_chat.length > 0 ?
                    code_chat.map((single_chat_object) => (
                        <div className='flex justify-center mt-8 sm:mt-20 w-full max-w-5xl mx-auto'>
                            {
                                single_chat_object.turn.includes('user') ?
                                    <div className='ml-auto lg:mr-[10%] bg-blue-200 rounded-md max-w-[90%] sm:max-w-2xl'>
                                        <p className='font-bold font-mono p-2 text-base sm:text-xl'>
                                            {single_chat_object.res}
                                        </p>
                                    </div>
                                    :
                                    <div className='mr-auto lg:ml-[10%] bg-blue-400 rounded-md max-w-[90%] sm:max-w-3xl'>
                                        <p className='font-bold font-mono p-2 text-base sm:text-xl text-white'>
                                            {single_chat_object.res}
                                        </p>
                                    </div>
                            }
                        </div>
                    ))
                    : <></>
            }

            {/* Input */}
            <div className='flex items-center bg-white mt-8 sm:mt-10 rounded-md w-full max-w-4xl'>
                <FaSearch className='ml-3 text-lg sm:text-xl' />
                <input
                    onKeyDown={(e) => handleKeyDown(e)}
                    onChange={(e) => updateSearchQuery(e)}
                    className='h-14 sm:h-16 flex-1 pl-4 outline-none text-base sm:text-xl'
                    type='text'
                    placeholder='Search for anything'
                />
                <div
                    onClick={handleSearch}
                    className='bg-blue-400 px-4 sm:px-6 h-10 sm:h-12 m-2 hover:scale-105 cursor-pointer rounded-md flex items-center'
                >
                    <h2 className='text-white text-base sm:text-2xl font-bold font-mono italic'>
                        Search
                    </h2>
                </div>
            </div>
        </div>

        {/* Error Message */}
        <p className='text-white text-base sm:text-xl italic font-mono mt-5 text-center px-4'>
            Its us....internal server error
        </p>
    </>
)

        }
    }
    
    else{

        content = (
    <>
        {/* Top Right Controls */}
        <div className="absolute top-0 right-0 flex flex-wrap gap-2 p-3 sm:p-4 text-white font-mono font-bold italic text-sm sm:text-xl">
            {display_results_type == 'doc_results' ?
                <>
                    <p className='bg-blue-700 px-3 py-1 sm:p-2 rounded-md'>Docs</p>
                    <p
                        onClick={() => changeDisplayResultsType('ai_results')}
                        className='bg-blue-400 px-3 py-1 sm:p-2 rounded-md cursor-pointer hover:scale-105'
                    >
                        AI Mode
                    </p>
                </>
                :
                <>
                    <p
                        onClick={() => changeDisplayResultsType('doc_results')}
                        className='bg-blue-400 px-3 py-1 sm:p-2 rounded-md cursor-pointer hover:scale-105'
                    >
                        Docs
                    </p>
                    <p className='bg-blue-700 px-3 py-1 sm:p-2 rounded-md'>AI Mode</p>
                </>
            }
            <p className='bg-green-100 text-black px-3 py-1 sm:p-2 rounded-md flex items-center gap-1'>
                RAG <Switch checked={isChecked} onChange={handleToggle} />
            </p>
        </div>

        {/* Logo */}
        <div className="absolute top-0 left-0 bg-blue-400 m-3 sm:m-5 px-4 py-2 rounded-md hover:scale-110 cursor-pointer">
            <p className="text-white text-lg sm:text-xl font-bold font-mono">AiRRo</p>
        </div>

        {display_results_type == 'doc_results' ?
            /* ================= DOC MODE ================= */
            <div className='flex flex-col items-center justify-center mt-32 sm:mt-60 px-4'>
                <p className='text-white text-4xl sm:text-6xl italic font-bold font-mono text-center'>
                    __Entity__
                </p>

                <p className='text-white text-base sm:text-xl italic font-mono mt-4 text-center'>
                    "Providing swift, consistent, and transparent outcomes."
                </p>

                {/* Search Bar */}
                <div className='flex items-center bg-white mt-8 rounded-md w-full max-w-4xl'>
                    <FaSearch className='ml-3 text-lg sm:text-xl' />
                    <input
                        onKeyDown={(e) => handleKeyDown(e)}
                        onChange={(e) => updateSearchQuery(e)}
                        className='h-14 sm:h-16 flex-1 pl-4 outline-none text-base sm:text-xl'
                        type='text'
                        placeholder='Search for anything'
                    />
                    <div
                        onClick={handleSearch}
                        className='bg-blue-400 px-4 sm:px-6 h-10 sm:h-12 m-2 hover:scale-105 cursor-pointer rounded-md flex items-center'
                    >
                        <h2 className='text-white text-base sm:text-2xl font-bold font-mono italic'>
                            Search
                        </h2>
                    </div>
                </div>
            </div>
            :
            /* ================= AI MODE ================= */
            <>
                <div className='flex flex-col items-center justify-center mt-24 sm:mt-15 px-4'>
                    <p className='text-white text-4xl sm:text-6xl italic font-bold font-mono text-center'>
                        __Entity__
                    </p>
                    <p className='text-white text-base sm:text-xl italic font-mono mt-4 text-center'>
                        "Providing swift, consistent, and transparent outcomes."
                    </p>
                </div>

                {/* Chat Messages */}
                {chatType == 'chat' ?
                    dummy_chat.length > 0 ?
                        dummy_chat.map((single_chat_object) => (
                            <div className='flex justify-center mt-10 px-4'>
                                {single_chat_object.turn.includes('user') ?
                                    <div className='ml-auto bg-blue-200 rounded-md max-w-full sm:max-w-2xl'>
                                        <p className='font-bold font-mono p-2 text-base sm:text-xl'>
                                            {single_chat_object.res}
                                        </p>
                                    </div>
                                    :
                                    <div className='bg-blue-400 rounded-md max-w-full sm:max-w-3xl'>
                                        <p className='font-bold font-mono p-2 text-base sm:text-xl text-white'>
                                            {single_chat_object.res}
                                        </p>
                                    </div>
                                }
                            </div>
                        ))
                        : <></>
                    :
                    code_chat.length > 0 ?
                        code_chat.map((single_chat_object) => (
                            <div className='flex justify-center mt-10 px-4'>
                                {single_chat_object.turn.includes('user') ?
                                    <div className='ml-auto bg-blue-200 rounded-md max-w-full sm:max-w-2xl'>
                                        <p className='font-bold font-mono p-2 text-base sm:text-xl'>
                                            {single_chat_object.res}
                                        </p>
                                    </div>
                                    :
                                    <div className='bg-blue-400 rounded-md max-w-full sm:max-w-3xl'>
                                        <p className='font-bold font-mono p-2 text-base sm:text-xl text-white'>
                                            {single_chat_object.res}
                                        </p>
                                    </div>
                                }
                            </div>
                        ))
                        : <></>
                }

                {/* Bottom Input */}
                <div className='flex flex-col justify-end w-full max-w-4xl mx-auto px-4 h-[calc(100vh-120px)] overflow-y-auto'>
                    <div className='flex items-center bg-white mt-6 rounded-md'>
                        <FaSearch className='ml-3 text-lg sm:text-xl' />
                        <input
                            onKeyDown={(e) => handleKeyDown(e)}
                            onChange={(e) => updateSearchQuery(e)}
                            className='h-14 sm:h-16 flex-1 pl-4 outline-none text-base sm:text-xl'
                            type='text'
                            placeholder='Search for anything'
                            id='specificInput'
                        />
                        <div
                            onClick={handleSearch}
                            className='bg-blue-400 px-6 h-10 sm:h-12 m-2 hover:scale-105 cursor-pointer rounded-md flex items-center'
                        >
                            <h2 className='text-white text-base sm:text-2xl font-bold font-mono italic'>
                                Go
                            </h2>
                        </div>
                    </div>
                </div>
            </>
        }
    </>
)

    }

    return content

}

export default LandingPage








