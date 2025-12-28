import React from 'react'
import { FaSearch } from "react-icons/fa";

function DocsResult({searchResults}) {
  return (
    <>
        {searchResults.ranked_docs.map((single_result) => (
            <>
                <div className='flex justify-center px-4'>
                    <div className='mt-2 mb-8 sm:mb-10 bg-purple-50 rounded-md w-full max-w-5xl mx-auto p-4 sm:p-6 sm:pl-8'>
                        <div>
                            <a href={single_result.link} className='hover:underline'>
                                <div className='hover:scale-102 transition-transform'>
                                    <p className='font-mono text-xs sm:text-sm font-bold break-all'>
                                        {single_result.link}
                                    </p>
                                    <p className='font-mono text-lg sm:text-2xl font-bold mt-1'>
                                        {single_result.title}
                                    </p>
                                </div>
                            </a>
                            <p className='font-mono text-sm sm:text-md mt-2'>
                                {single_result.content}...
                            </p>
                        </div>
                    </div>
                </div>
            </>
        ))}
    </>
)

}

export default DocsResult