<script>
	import { db } from '$lib/data/link';

	import Fuse from 'fuse.js';

	export let textInputs = '';

	const fuse = new Fuse(db, {
		keys: ['title', 'description'],
		includeScore: true
	});
	$: linkResult = fuse.search(textInputs);

	function finding() {
		return 'กำลังหาจากเซิฟเวอร์';
	}

	function add() {
		console.log('ยังไม่เปิดใช้งาน');
	}
</script>

<!-- markup (zero or more items) goes here -->
<section>
	<div class="flex justify-center my-5">
		<input
			class=" text-center bg-purple-200 hover:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 "
			type="search"
			bind:value={textInputs}
			placeholder="ค้นหา"
		/>
		<button on:click={finding}> ค้นหา🚀 </button>
		<button on:click={add}> เพิ่ม </button>
	</div>

	<div class="grid">
		<ul>
			{#each linkResult as link}
				<div class="box">
					<h2>
						{JSON.stringify(link)}
					</h2>
				</div>
			{/each}
		</ul>
	</div>
</section>

<style>
	.box {
		display: block;
		padding: auto;
		margin: 2px;
		width: 100%;
		border: 2px solid purple;
	}
</style>
