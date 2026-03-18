<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function seedDefaults(Request $request)
    {
        $user = $request->user();

        foreach (Category::DEFAULT_PROJECT_CATEGORIES as $defaultCategory) {
            $user->categories()->firstOrCreate(
                ['name' => $defaultCategory['name']],
                ['color' => $defaultCategory['color']]
            );
        }

        $categories = $user->categories()
            ->withCount('tasks')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $categories = auth()->user()
            ->categories()
            ->withCount('tasks')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCategoryRequest $request)
    {
        $category = $request->user()->categories()->create($request->validated());

        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = auth()->user()->categories()->withCount('tasks')->findOrFail($id);

        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCategoryRequest $request, string $id)
    {
        $category = auth()->user()->categories()->findOrFail($id);
        $category->update($request->validated());

        return response()->json($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = auth()->user()->categories()->findOrFail($id);
        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}
